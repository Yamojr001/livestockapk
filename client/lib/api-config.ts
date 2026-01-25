import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL_KEY = "@livestock_api_url";
const AUTH_TOKEN_KEY = "@livestock_auth_token";

const DEFAULT_API_URL = "http://127.0.0.1:8000/api/v1";

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

export async function apiRequest(
  endpoint,
  options = {}
) {
  const { method = "GET", body, requiresAuth = true } = options;

  try {
    const baseUrl = await getApiBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (requiresAuth) {
      const token = await getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    console.log(`API Request: ${method} ${url}`, {
      headers,
      body: body ? (body.farmer_name ? { ...body, farmer_image: body.farmer_image ? '[IMAGE_URI]' : null } : body) : null,
    });

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

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
        const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        
        return {
          success: false,
          error: errorMessage || "Validation failed",
          validationErrors: responseData.errors,
          status: response.status,
        };
      }

      // Handle other errors
      const errorMessage = responseData?.error || 
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
    
    // Provide more helpful error messages
    if (errorMessage.includes("Failed to fetch") || 
        errorMessage.includes("NetworkError") || 
        errorMessage.includes("Network request failed")) {
      errorMessage = "Cannot reach server. Please check your internet connection and try again.";
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
    const testUrl = baseUrl.endsWith('/api/v1') ? baseUrl.replace('/api/v1', '/api') : baseUrl;
    
    console.log("Testing API connection to:", testUrl);
    
    const response = await fetch(testUrl, {
      method: "GET",
      headers: { 
        "Accept": "application/json",
        "Content-Type": "application/json"
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
    const endpoint = queryString ? `/submissions?${queryString}` : "/submissions";
    return apiRequest(endpoint);
  },

  async getStats() {
    return apiRequest("/submissions/stats");
  },

  async syncBatch(submissions) {
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