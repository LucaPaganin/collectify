import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        // Set auth token for axios requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', { username, password });
      const user = response.data;
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set auth token for axios requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      setCurrentUser(user);
      return user;
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid username or password');
      throw error;
    }
  };

  const register = async (username, password, email) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/register', {
        username,
        password,
        email
      });
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
