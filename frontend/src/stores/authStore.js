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
  isSubmitting: false, // For form submissions (login, register, etc.)
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
    set({ isSubmitting: true, error: null });

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
        isSubmitting: false,
        error: null,
      });

      return { success: true, user: data.data.user };
    } catch (error) {
      set({
        error: error.message,
        isSubmitting: false,
        isAuthenticated: false,
        user: null,
      });
      return { success: false, error: error.message };
    }
  },

  register: async (userData) => {
    set({ isSubmitting: true, error: null });

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
        isSubmitting: false,
        error: null,
      });

      return { success: true, message: data.message };
    } catch (error) {
      set({
        error: error.message,
        isSubmitting: false,
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
 * Hook for auth actions - uses getState() for stable references
 * These actions are stable and won't cause re-renders when destructured
 */
export const useAuthActions = () => {
  // Get actions directly from store - these are stable references
  const store = useAuthStore.getState();

  return {
    setUser: store.setUser,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    checkAuth: store.checkAuth,
    login: store.login,
    register: store.register,
    logout: store.logout,
    updateProfile: store.updateProfile,
    changePassword: store.changePassword,
    deleteAccount: store.deleteAccount,
    hideNavbar: store.hideNavbar,
    showNavbarAction: store.showNavbarAction,
  };
};

/**
 * Hook for auth state - uses individual selectors to prevent over-subscription
 * Components only re-render when the specific state they use changes
 */
export const useAuthState = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const showNavbar = useAuthStore((state) => state.showNavbar);

  return {
    user,
    isAuthenticated,
    isLoading,
    isSubmitting,
    error,
    showNavbar,
  };
};
