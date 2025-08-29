/**
 * Utilities for testing and managing API connections
 */

import { api } from './authUtils';
import config from '../config';

/**
 * Tests the API connection and returns diagnostic information
 * @returns {Promise<Object>} Connection status and diagnostic information
 */
export const testApiConnection = async () => {
  const diagnostics = {
    apiUrl: config.apiUrl,
    windowLocation: window.location.href,
    connectionStatus: 'unknown',
    error: null,
    timestamp: new Date().toISOString(),
    networkInfo: {
      online: navigator.onLine,
      userAgent: navigator.userAgent,
    }
  };

  try {
    // Try a simple OPTIONS request to test connectivity
    const startTime = Date.now();
    const response = await api.options('/');
    const endTime = Date.now();
    
    diagnostics.connectionStatus = 'success';
    diagnostics.responseTime = endTime - startTime;
    diagnostics.statusCode = response.status;
    diagnostics.headers = response.headers;
    
    console.log('API connection test successful:', diagnostics);
    return diagnostics;
  } catch (error) {
    diagnostics.connectionStatus = 'failed';
    diagnostics.error = {
      message: error.message,
      code: error.code,
      stack: error.stack,
    };
    
    if (error.response) {
      diagnostics.statusCode = error.response.status;
      diagnostics.responseData = error.response.data;
    } else if (error.request) {
      diagnostics.requestInfo = {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
      };
    }
    
    console.error('API connection test failed:', diagnostics);
    return diagnostics;
  }
};

/**
 * Suggests an alternative API URL based on network conditions
 * @returns {string|null} Suggested API URL or null if current one is fine
 */
export const suggestAlternativeApiUrl = () => {
  const currentApiUrl = config.apiUrl;
  const currentHost = window.location.hostname;
  
  try {
    // Parse the current API URL
    const urlObj = new URL(currentApiUrl);
    const apiHost = urlObj.hostname;
    
    // If API host is localhost/127.0.0.1 but we're accessing from a different device
    if ((apiHost === 'localhost' || apiHost === '127.0.0.1') && 
        (currentHost !== 'localhost' && currentHost !== '127.0.0.1' && currentHost !== '')) {
      
      // Create a new URL with the current hostname
      urlObj.hostname = currentHost;
      return urlObj.toString();
    }
    
    return null; // No suggestion needed
  } catch (e) {
    console.error('Error analyzing API URL:', e);
    return null;
  }
};

export default {
  testApiConnection,
  suggestAlternativeApiUrl
};