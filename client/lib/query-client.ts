import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Gets the base URL for the API server
 * @returns {string} The API base URL
 */
export function getApiUrl(): string {
  // Use environment variable or default
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
  const apiPath = process.env.EXPO_PUBLIC_API_PATH || "/api/v1";
  
  return `${baseUrl}${apiPath}`;
}

// Create a custom fetch function with better error handling
async function customFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    // Handle non-2xx responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, get text
        const text = await response.text();
        if (text) errorMessage = `${errorMessage}: ${text}`;
      }

      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Enhanced API request function with better error handling and retry logic
 */
export async function apiRequest(
  method: string,
  route: string,
  data?: unknown,
  options?: {
    headers?: Record<string, string>;
    timeout?: number;
    retry?: number;
  }
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl).toString();

  const defaultOptions = {
    method,
    headers: options?.headers || {},
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  };

  let retryCount = 0;
  const maxRetries = options?.retry || 3;

  while (retryCount < maxRetries) {
    try {
      return await customFetch(url, defaultOptions);
    } catch (error: any) {
      retryCount++;
      
      // Don't retry on certain errors
      if (error.message.includes('Network error') || retryCount >= maxRetries) {
        throw error;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Request failed after ${maxRetries} retries`);
}

/**
 * Create a query function with automatic error handling and caching
 */
export const createQueryFn = <T>(options?: {
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  onError?: (error: Error) => void;
}): QueryFunction<T> => {
  return async ({ queryKey }) => {
    const [endpoint, params] = queryKey;
    const url = new URL(endpoint as string, getApiUrl());
    
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    try {
      const response = await customFetch(url.toString());
      const data = await response.json();
      
      // Handle API response format { success, data, message }
      if (data.success !== undefined) {
        if (!data.success) {
          throw new Error(data.message || data.error || 'Request failed');
        }
        return data.data;
      }
      
      return data;
    } catch (error) {
      if (options?.onError) {
        options.onError(error as Error);
      }
      throw error;
    }
  };
};

/**
 * Configured query client with default options
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: createQueryFn(),
      retry: (failureCount, error: any) => {
        // Don't retry on 401 (unauthorized) or 403 (forbidden)
        if (error.message?.includes('401') || error.message?.includes('403')) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (React Query v5 renamed cacheTime to gcTime)
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchInterval: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Predefined query keys for type safety
 */
export const queryKeys = {
  // Auth
  auth: {
    me: ['auth', 'me'],
    profile: ['auth', 'profile'],
  },
  
  // Submissions
  submissions: {
    all: ['submissions'],
    list: (params?: any) => ['submissions', 'list', params],
    details: (id: string) => ['submissions', 'details', id],
    stats: ['submissions', 'stats'],
    pending: ['submissions', 'pending'],
  },
  
  // Users
  users: {
    all: ['users'],
    list: (params?: any) => ['users', 'list', params],
    details: (id: string) => ['users', 'details', id],
    stats: ['users', 'stats'],
  },
  
  // Notifications
  notifications: {
    all: ['notifications'],
    unread: ['notifications', 'unread'],
  },
  
  // Dashboard
  dashboard: {
    overview: ['dashboard', 'overview'],
    stats: ['dashboard', 'stats'],
  },
};

/**
 * Helper function to invalidate queries
 */
export function invalidateQueries(queryKey: any[]) {
  return queryClient.invalidateQueries({ queryKey });
}

/**
 * Helper function to prefetch queries
 */
export async function prefetchQuery<T>(queryKey: any[], queryFn: QueryFunction<T>) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
}

/**
 * Helper function to update query data optimistically
 */
export function updateQueryData<T>(
  queryKey: any[],
  updater: (oldData: T | undefined) => T
) {
  return queryClient.setQueryData(queryKey, updater);
}

/**
 * Clear all queries cache (useful for logout)
 */
export function clearQueryCache() {
  queryClient.clear();
}

/**
 * Set authentication token for all requests
 */
export function setAuthToken(token: string) {
  // This assumes you have a global request interceptor
  // For React Query, you might need to use a custom fetch function
  console.log('Auth token set:', token ? '***' + token.slice(-4) : 'none');
}

/**
 * Create a mutation with optimistic updates
 */
export function createOptimisticMutation<T, V>({
  mutationFn,
  onMutate,
  queryKey,
}: {
  mutationFn: (variables: V) => Promise<T>;
  onMutate: (variables: V) => any;
  queryKey: any[];
}) {
  return queryClient.getMutationCache().build(queryClient, {
    mutationFn,
    onMutate: async (variables: V) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update to the new value
      if (onMutate) {
        queryClient.setQueryData(queryKey, onMutate(variables));
      }

      return { previousData };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey });
    },
  });
}