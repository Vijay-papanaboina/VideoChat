import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Backend URL
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Check if user is logged in on app start
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // API helper function
  const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Register new user
  const register = async (userData) => {
    try {
      const data = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      const data = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      if (token) {
        await apiCall('/api/auth/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const data = await apiCall('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const data = await apiCall('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      });

      return data;
    } catch (error) {
      throw error;
    }
  };

  // Delete account
  const deleteAccount = async (password) => {
    try {
      const data = await apiCall('/api/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      });

      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return data;
    } catch (error) {
      throw error;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
