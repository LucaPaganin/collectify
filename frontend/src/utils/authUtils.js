import axios from 'axios';
import createRefresh from 'react-auth-kit/createRefresh';
import config from '../config';

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: config.apiUrl,  // Get API URL from config
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    if (!axios.isCancel(error)) {
      // Log errors (but not cancellations)
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  }
);

// Create refresh token functionality
export const refreshApi = createRefresh({
  interval: 10, // refresh token every 10 minutes
  refreshApiCallback: async ({ authToken, refreshToken }) => {
    try {
      // Call the backend refresh endpoint with the refresh token
      const response = await api.post('/auth/refresh', { 
        refreshToken 
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      return {
        isSuccess: true,
        newAuthToken: response.data.token,
        newRefreshToken: response.data.refreshToken,
        newAuthTokenExpireIn: 60 * 60 // 1 hour
      };
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return {
        isSuccess: false,
        newAuthToken: null
      };
    }
  }
});

// Add auth token to requests
export const setupAuthInterceptor = (getAuthToken) => {
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Auth-related API functions
export const loginUser = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};
