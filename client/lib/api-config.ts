import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL_KEY = "@livestock_api_url";
const AUTH_TOKEN_KEY = "@livestock_auth_token";

const DEFAULT_API_URL = "https://livestock.northdemy.com/api/v1";

export async function getApiBaseUrl() {
  try {
    const storedUrl = await AsyncStorage.getItem(API_URL_KEY);
    return storedUrl || DEFAULT_API_URL;
  } catch {
    return DEFAULT_API_URL;
  }
}

export async function setApiBaseUrl(url) {
  await AsyncStorage.setItem(API_URL_KEY, url);
}

export async function getAuthToken() {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token) {
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export async function clearAuthToken() {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, requiresAuth = true } = options;

  try {
    const baseUrl = await getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const isFormData =
      (typeof FormData !== "undefined" && body instanceof FormData) ||
      (body && typeof body === "object" && "_parts" in body);

    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    if (requiresAuth) {
      const token = await getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    console.log(`API Request: ${method} ${url}`, {
      headers,
      body: isFormData
        ? "[FORM_DATA]"
        : body
          ? body.farmer_name
            ? { ...body, farmer_image: body.farmer_image ? "[IMAGE_URI]" : null }
            : body
          : null,
    });

    const requestPromise = fetch(url, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    const timeoutPromise = new Promise((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error("Request timed out"));
      }, 20000);
    });

    const response = await Promise.race([requestPromise, timeoutPromise]);

    // Parse response
    let responseData = null;
    const text = await response.text();

    if (text) {
      try {
        responseData = JSON.parse(text);
      } catch (err) {
        console.log("Failed to parse JSON response:", text);
        responseData = { message: text };
      }
    }

    console.log(`API Response: ${response.status} ${url}`, responseData);

    // Handle non-2xx responses
    if (!response.ok) {
      // Handle Laravel validation errors
      if (response.status === 422 && responseData.errors) {
        const firstError = Object.values(responseData.errors)[0];
        const errorMessage = Array.isArray(firstError)
          ? firstError[0]
          : firstError;

        return {
          success: false,
          error: errorMessage || "Validation failed",
          validationErrors: responseData.errors,
          status: response.status,
        };
      }

      // Handle other errors
      const errorMessage =
        responseData?.error ||
        responseData?.message ||
        responseData?.data?.message ||
        `Request failed with status ${response.status}`;

      return {
        success: false,
        error: errorMessage,
        status: response.status,
        data: responseData,
      };
    }

    // Handle success responses
    if (responseData && responseData.success !== undefined) {
      return {
        success: responseData.success,
        data: responseData.data || responseData,
        message: responseData.message,
        status: response.status,
      };
    }

    // Handle raw success responses
    return {
      success: true,
      data: responseData,
      status: response.status,
    };
  } catch (error) {
    console.error("API Request Error:", error);

    let errorMessage = error.message || "Network error";

    if (errorMessage === "Request timed out") {
      errorMessage = "Request timed out. Please try again.";
    }

    if (
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("NetworkError") ||
      errorMessage.includes("Network request failed")
    ) {
      errorMessage =
        "Cannot reach server. Please check your internet connection and try again.";
    }

    if (errorMessage.includes("JSON Parse error")) {
      errorMessage = "Server returned invalid response. Please try again.";
    }

    return {
      success: false,
      error: errorMessage,
      isNetworkError: true,
    };
  }
}

export async function testApiConnection() {
  try {
    const baseUrl = await getApiBaseUrl();
    const testUrl = baseUrl.endsWith("/api/v1")
      ? baseUrl.replace("/api/v1", "/api")
      : baseUrl;

    console.log("Testing API connection to:", testUrl);

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    const isOk = response.ok;
    console.log("API connection test result:", isOk, response.status);

    return isOk;
  } catch (error) {
    console.error("API connection test failed:", error);
    return false;
  }
}

// Helper function for common API calls
export const submissionApi = {
  async create(data) {
    return apiRequest("/submissions", {
      method: "POST",
      body: data,
    });
  },

  async getAll(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/submissions?${queryString}`
      : "/submissions";
    return apiRequest(endpoint);
  },

  async getStats() {
    return apiRequest("/submissions/stats");
  },

  async syncBatch(submissions: any[]) {
    // Check if any submission has a local image that needs to be sent as a file
    const needsMultipart = submissions.some(sub =>
      sub.farmer_image && typeof sub.farmer_image === 'string' && sub.farmer_image.startsWith('file://')
    );

    if (needsMultipart) {
      const formData = new FormData();

      submissions.forEach((sub, index) => {
        // Handle each field, convert image URIs to file objects
        Object.keys(sub).forEach(key => {
          const value = sub[key];
          if (key === 'farmer_image' && value && typeof value === 'string' && value.startsWith('file://')) {
            // Convert to file object
            const filename = value.split('/').pop() || 'image.jpg';
            const match = /\\.(\\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            formData.append(`submissions[${index}][${key}]`, {
              uri: value,
              name: filename,
              type,
            } as any);
          } else {
            // Regular field
            formData.append(`submissions[${index}][${key}]`, value != null ? String(value) : '');
          }
        });
      });

      return apiRequest("/submissions/sync", {
        method: "POST",
        body: formData,
      });
    }

    // No images to upload as files → send JSON
    return apiRequest("/submissions/sync", {
      method: "POST",
      body: { submissions },
    });
  },

  async getPending() {
    return apiRequest("/submissions/pending");
  },
};

export const authApi = {
  async login(email, password) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: { email, password },
      requiresAuth: false,
    });
  },

  async register(data) {
    return apiRequest("/auth/register", {
      method: "POST",
      body: data,
      requiresAuth: false,
    });
  },

  async getProfile() {
    return apiRequest("/auth/me");
  },

  async updateProfile(data) {
    return apiRequest("/auth/profile", {
      method: "PUT",
      body: data,
    });
  },

  async logout() {
    return apiRequest("/auth/logout", {
      method: "POST",
    });
  },
};
