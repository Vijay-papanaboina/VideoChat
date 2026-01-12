import { create } from "zustand";

/**
 * Authentication store using Zustand for global state management
 * Uses HTTP-only cookies for secure token storage
 */
export const useAuthStore = create((set) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true for initial auth check
  error: null,
  showNavbar: true, // Navbar visibility

  // Actions
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
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

  // Navbar actions
  hideNavbar: () => {
    set({ showNavbar: false });
  },

  showNavbarAction: () => {
    set({ showNavbar: true });
  },

  // Check authentication status on app load
  checkAuth: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
        }/api/auth/verify`,
        {
          method: "GET",
          credentials: "include", // Include cookies
        }
      );

      if (response.ok) {
        const data = await response.json();
        set({
          user: data.data,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return { success: true, user: data.data };
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        return { success: false };
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
      return { success: false };
    }
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
          credentials: "include", // Include cookies
          body: JSON.stringify(credentials),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();

      set({
        user: data.data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, user: data.data.user };
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        isAuthenticated: false,
        user: null,
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
          credentials: "include",
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();

      // Registration successful - don't log in, just return success
      set({
        isLoading: false,
        error: null,
      });

      return { success: true, message: data.message };
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
        }/api/auth/logout`,
        {
          method: "POST",
          credentials: "include", // Include cookies
        }
      );

      // Clear state regardless of response
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      // Clear state even if logout request fails
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
      return { success: true };
    }
  },

  updateProfile: async (updateData) => {
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
          },
          credentials: "include", // Include cookies
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Profile update failed");
      }

      const data = await response.json();

      set({
        user: data.data,
        isLoading: false,
        error: null,
      });

      return { success: true, user: data.data };
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  changePassword: async (passwordData) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
        }/api/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies
          body: JSON.stringify(passwordData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Password change failed");
      }

      set({
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },

  deleteAccount: async (password) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
        }/api/auth/account`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Account deletion failed");
      }

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      return { success: false, error: error.message };
    }
  },
}));

/**
 * Hook for auth actions
 */
export const useAuthActions = () => {
  const {
    setUser,
    setLoading,
    setError,
    clearError,
    checkAuth,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    hideNavbar,
    showNavbarAction,
  } = useAuthStore();

  return {
    setUser,
    setLoading,
    setError,
    clearError,
    checkAuth,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    hideNavbar,
    showNavbarAction,
  };
};

/**
 * Hook for auth state
 */
export const useAuthState = () => {
  const { user, isAuthenticated, isLoading, error, showNavbar } =
    useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    showNavbar,
  };
};
