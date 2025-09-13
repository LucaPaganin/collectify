import axios from 'axios';
import createRefresh from 'react-auth-kit/createRefresh';
import config from '../config';

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: config.apiUrl,  // Get API URL from config
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials for cross-domain requests with credentials
  withCredentials: false,
  // Trust self-signed certificates
  httpsAgent: new (require('https').Agent)({
    rejectUnauthorized: false
  })
});

// Log the API URL for debugging
console.log(`API configured with base URL: ${config.apiUrl}`);
console.log(`Current window location: ${window.location.origin}`);
console.log('HTTPS Agent configured to trust self-signed certificates');

// Test the API connection on startup
const testApiConnection = async () => {
  try {
    // Attempt a simple OPTIONS request to check connectivity
    const response = await api.options('/');
    console.log('API connection test successful:', response.status);
    return true;
  } catch (error) {
    console.error('API connection test failed:', error.message);
    // If the connection failed, log detailed information to help debugging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received. Request details:', {
        url: error.request.url || config.apiUrl,
        method: error.request.method || 'OPTIONS',
      });
    }
    return false;
  }
};

// Run the API connection test
testApiConnection();

// Add response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    if (!axios.isCancel(error)) {
      // Log errors (but not cancellations)
      console.error('API Error:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        console.error('Request URL:', error.config?.url);
        console.error('Request method:', error.config?.method);
        console.error('Request baseURL:', error.config?.baseURL);
        
        // If we're getting network errors, it could be due to incorrect host
        if (error.message && error.message.includes('Network Error')) {
          console.error('Network error detected - this may be due to incorrect API host configuration');
          console.error('Current API URL:', config.apiUrl);
          console.error('Current window location:', window.location.origin);
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
      }
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
