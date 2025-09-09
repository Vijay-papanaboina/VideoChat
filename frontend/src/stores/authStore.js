import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Authentication store using Zustand for global state management
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token) => {
        set({ token });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
            }/api/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(credentials),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Login failed");
          }

          const data = await response.json();

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true, user: data.user };
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
          });
          return { success: false, error: error.message };
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
            }/api/auth/register`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(userData),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Registration failed");
          }

          const data = await response.json();

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return { success: true, user: data.user };
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
            isAuthenticated: false,
            user: null,
            token: null,
          });
          return { success: false, error: error.message };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        set({ isLoading: true });

        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
            }/api/auth/verify`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Token verification failed");
          }

          const data = await response.json();

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message,
          });
          return false;
        }
      },

      updateProfile: async (profileData) => {
        const { token } = get();
        if (!token) {
          throw new Error("Not authenticated");
        }

        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
            }/api/auth/profile`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(profileData),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Profile update failed");
          }

          const data = await response.json();

          set({
            user: data.user,
            isLoading: false,
            error: null,
          });

          return { success: true, user: data.user };
        } catch (error) {
          set({
            error: error.message,
            isLoading: false,
          });
          return { success: false, error: error.message };
        }
      },
    }),
    {
      name: "auth-storage",
      // Only persist user and token, not loading states
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Hook for auth actions
 */
export const useAuthActions = () => {
  const {
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    setLoading,
    setError,
    clearError,
  } = useAuthStore();

  return {
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    setLoading,
    setError,
    clearError,
  };
};

/**
 * Hook for auth state
 */
export const useAuthState = () => {
  const { user, token, isAuthenticated, isLoading, error } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
  };
};
