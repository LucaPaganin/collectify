import config from '../config';

/**
 * Checks API connectivity by attempting to reach the /api endpoint
 * @returns {Promise<Object>} Status object with checked, connected, and suggestedUrl properties
 */
export const resolveApiStatus = async () => {
  const apiUrl = config.apiUrl;
  
  try {
    // Try to fetch from the API endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
      credentials: 'include',
    });
    
    clearTimeout(timeoutId);
    
    // If we get any response (even errors), the API is reachable
    return {
      checked: true,
      connected: response.ok || response.status >= 200,
      suggestedUrl: null
    };
  } catch (error) {
    console.error('API connectivity check failed:', error);
    
    // Try to suggest an alternative URL if we're on HTTPS but API is HTTP
    let suggestedUrl = null;
    if (typeof window !== 'undefined' && 
        window.location.protocol === 'https:' && 
        apiUrl.startsWith('http:')) {
      // Suggest using HTTP for the frontend instead
      suggestedUrl = window.location.href.replace('https:', 'http:');
    } else if (typeof window !== 'undefined' && 
               apiUrl.includes('localhost') && 
               window.location.hostname !== 'localhost') {
      // Suggest using the current hostname instead of localhost
      try {
        const apiUrlObj = new URL(apiUrl);
        apiUrlObj.hostname = window.location.hostname;
        suggestedUrl = apiUrlObj.toString();
      } catch (e) {
        console.error('Error creating suggested URL:', e);
      }
    }
    
    return {
      checked: true,
      connected: false,
      suggestedUrl
    };
  }
};

/**
 * Continuously monitors API connectivity status
 * @param {Function} onStatusChange Callback function called when status changes
 * @param {number} intervalMs Interval in milliseconds to check status (default: 30000)
 * @returns {Function} Cleanup function to stop monitoring
 */
export const monitorApiStatus = (onStatusChange, intervalMs = 30000) => {
  let intervalId;
  
  const checkStatus = async () => {
    const status = await resolveApiStatus();
    onStatusChange(status);
  };
  
  // Check immediately
  checkStatus();
  
  // Then check at intervals
  intervalId = setInterval(checkStatus, intervalMs);
  
  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};
