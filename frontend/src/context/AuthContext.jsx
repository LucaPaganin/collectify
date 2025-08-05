import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create a context for authentication state
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Try to get token from sessionStorage first, then localStorage
  const getStoredToken = () => {
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  };

  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('auth_token'));

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => axios.interceptors.request.eject(interceptor);
  }, [token]);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/me');
        setCurrentUser(response.data);
      } catch (err) {
        // If token is invalid, clear it
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  // Login function
  const login = async (username, password, remember = false) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', { username, password });
      const { token, user } = response.data;
      
      // Always store token in sessionStorage (for current session)
      sessionStorage.setItem('auth_token', token);
      
      // If remember me is checked, also store in localStorage
      if (remember) {
        localStorage.setItem('auth_token', token);
        setRememberMe(true);
      } else {
        localStorage.removeItem('auth_token');
        setRememberMe(false);
      }
      
      // Update state
      setToken(token);
      setCurrentUser(user);
      
      return user;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      setError(null);
      await axios.post('/api/auth/register', { username, email, password });
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    setToken(null);
    setCurrentUser(null);
    setRememberMe(false);
  };

  // Context value
  const value = {
    currentUser,
    token,
    loading,
    error,
    login,
    register,
    logout,
    rememberMe,
    setRememberMe,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.is_admin || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
