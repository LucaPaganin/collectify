import axios from 'axios';

/**
 * Utility for making cancellable API requests
 * This helps prevent multiple in-flight requests and memory leaks
 */

// Create a map to store active request cancelers
const requestCancelers = new Map();

/**
 * Make a GET request with automatic cancellation of previous requests with the same ID
 * @param {string} url - The URL to request
 * @param {string} requestId - Unique identifier for this request type (e.g., 'searchItems')
 * @param {Object} config - Axios config object
 * @returns {Promise} - The axios response promise
 */
export const cancellableGet = async (url, requestId, config = {}) => {
  // Cancel any existing request with the same ID
  cancelRequest(requestId);
  
  // Create a new AbortController
  const controller = new AbortController();
  
  // Store the cancel function
  requestCancelers.set(requestId, controller);
  
  try {
    // Make the request with the signal
    const response = await axios.get(url, {
      ...config,
      signal: controller.signal
    });
    
    // Clean up after successful request
    requestCancelers.delete(requestId);
    
    return response;
  } catch (error) {
    // Only rethrow if not a cancellation
    if (!axios.isCancel(error)) {
      requestCancelers.delete(requestId);
      throw error;
    }
    // Return a cancelled promise
    return Promise.reject(new axios.Cancel('Request was cancelled'));
  }
};

/**
 * Cancel a specific request by ID
 * @param {string} requestId - The ID of the request to cancel
 */
export const cancelRequest = (requestId) => {
  if (requestCancelers.has(requestId)) {
    const controller = requestCancelers.get(requestId);
    controller.abort();
    requestCancelers.delete(requestId);
  }
};

/**
 * Cancel all pending requests
 */
export const cancelAllRequests = () => {
  requestCancelers.forEach((controller) => {
    controller.abort();
  });
  requestCancelers.clear();
};

/**
 * Create a debounced function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to wait
 * @returns {Function} - The debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Export a pre-configured axios instance
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
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
