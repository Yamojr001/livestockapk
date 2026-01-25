import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage } from "@/lib/storage";
import { apiRequest, setAuthToken, getAuthToken, clearAuthToken } from "@/lib/api-config";
import type { User } from "@/types";

const HAS_AUTHENTICATED_KEY = "@livestock_has_authenticated";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; full_name: string; phone_number?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await storage.getUser();
      const token = await getAuthToken();
      
      console.log("[AUTH] Loading user...");
      console.log("[AUTH] Stored user:", storedUser ? { id: storedUser.id, email: storedUser.email, role: storedUser.user_role } : null);
      console.log("[AUTH] Token exists:", !!token);
      
      if (storedUser && token) {
        setUser(storedUser);
        console.log("[AUTH] User set from storage");
        try {
          const response = await apiRequest<{ user: User }>("/auth/me");
          console.log("[AUTH] /auth/me response:", response.success ? "Success" : `Failed: ${response.error}`);
          if (response.success && response.data?.user) {
            const apiUser = response.data.user;
            const updatedUser: User = {
              id: String(apiUser.id),
              email: apiUser.email,
              full_name: apiUser.full_name,
              phone_number: apiUser.phone_number || undefined,
              user_role: apiUser.user_role as "admin" | "agent",
              status: apiUser.status as "active" | "inactive",
              assigned_lga: apiUser.assigned_lga || undefined,
              assigned_ward: apiUser.assigned_ward || undefined,
              created_date: storedUser.created_date,
            };
            setUser(updatedUser);
            console.log("[AUTH] User updated from API");
            await storage.setUser(updatedUser);
          }
        } catch (error) {
          console.log("[AUTH] Could not refresh user from API, using cached data:", error);
        }
      } else {
        console.log("[AUTH] No stored user or token found");
      }
    } catch (error) {
      console.error("[AUTH] Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("[AUTH] Login attempt:", email);
      const hasAuthenticated = await AsyncStorage.getItem(HAS_AUTHENTICATED_KEY);
      const existingToken = await getAuthToken();
      const storedUser = await storage.getUser();
      
      console.log("[AUTH] Has previous auth:", !!hasAuthenticated);
      console.log("[AUTH] Has existing token:", !!existingToken);
      
      if (hasAuthenticated && existingToken && storedUser && storedUser.email.toLowerCase() === email.toLowerCase()) {
        console.log("[AUTH] Using cached authentication");
        setUser(storedUser);
        return { success: true };
      }

      console.log("[AUTH] Calling /auth/login API...");
      const response = await apiRequest<{ user: User; token: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
        requiresAuth: false,
      });

      console.log("[AUTH] Login response:", response.success ? "Success" : `Failed: ${response.error}`);
      if (response.success && response.data) {
        const { user: apiUser, token } = response.data;
        console.log("[AUTH] Received token and user:", { token: token.substring(0, 20) + "...", user: { id: apiUser.id, email: apiUser.email } });
        await setAuthToken(token);
        await AsyncStorage.setItem(HAS_AUTHENTICATED_KEY, "true");
        
        const userData: User = {
          id: String(apiUser.id),
          email: apiUser.email,
          full_name: apiUser.full_name,
          phone_number: apiUser.phone_number || undefined,
          user_role: apiUser.user_role as "admin" | "agent",
          status: apiUser.status as "active" | "inactive",
          assigned_lga: apiUser.assigned_lga || undefined,
          assigned_ward: apiUser.assigned_ward || undefined,
          created_date: new Date().toISOString(),
        };

        setUser(userData);
        await storage.setUser(userData);
        return { success: true };
      }

      if (!response.success) {
        const isNetworkError = response.error?.includes("Network") || 
                               response.error?.includes("fetch") ||
                               response.error?.includes("Failed to fetch");
        if (isNetworkError && hasAuthenticated && existingToken && storedUser) {
          setUser(storedUser);
          return { success: true };
        }
      }

      return { success: false, error: response.error || "Login failed. Please check your credentials and API settings." };
    } catch (error: any) {
      const hasAuthenticated = await AsyncStorage.getItem(HAS_AUTHENTICATED_KEY);
      const existingToken = await getAuthToken();
      const storedUser = await storage.getUser();
      
      if (hasAuthenticated && existingToken && storedUser) {
        setUser(storedUser);
        return { success: true };
      }
      
      return { success: false, error: "Cannot connect to server. First login requires internet connection." };
    }
  };

  const register = async (data: { email: string; password: string; full_name: string; phone_number?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiRequest<{ user: User; token: string }>("/auth/register", {
        method: "POST",
        body: data,
        requiresAuth: false,
      });

      if (response.success && response.data) {
        const { user: apiUser, token } = response.data;
        await setAuthToken(token);
        
        const userData: User = {
          id: String(apiUser.id),
          email: apiUser.email,
          full_name: apiUser.full_name,
          phone_number: apiUser.phone_number || undefined,
          user_role: apiUser.user_role as "admin" | "agent",
          status: apiUser.status as "active" | "inactive",
          created_date: new Date().toISOString(),
        };

        setUser(userData);
        await storage.setUser(userData);
        return { success: true };
      }

      return { success: false, error: response.error || "Registration failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "Registration failed" };
    }
  };

  const logout = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        try {
          const response = await apiRequest("/auth/logout", { method: "POST" });
          console.log("Logout response:", response);
        } catch (apiError) {
          console.log("API logout error (continuing with local logout):", apiError);
        }
      }
    } catch (error) {
      console.log("Token retrieval error (continuing with local logout):", error);
    } finally {
      // Always clear local auth state even if API call fails
      await clearAuthToken();
      await AsyncStorage.removeItem(HAS_AUTHENTICATED_KEY);
      await storage.setUser(null);
      setUser(null);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      const response = await apiRequest<{ user: User }>("/auth/profile", {
        method: "PUT",
        body: updates,
      });

      if (response.success && response.data?.user) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        await storage.setUser(updatedUser);
        return;
      }
    } catch (error) {
      console.log("API profile update failed, updating locally");
    }

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    await storage.setUser(updatedUser);
    await storage.updateUser(user.id, updates);
  };

  const setOnlineStatus = (status: boolean) => {
    setIsOnline(status);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isOnline,
        login,
        register,
        logout,
        updateUser,
        setOnlineStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
