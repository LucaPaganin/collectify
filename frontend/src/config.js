/**
 * Application configuration with environment-specific settings
 */

// Function to determine the best API URL to use
const determineApiUrl = () => {
  // Get the configured API URL from environment variables with fallback
  const configuredApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Parse the configured URL to get its host and protocol
  let configuredHost;
  let configuredProtocol;
  try {
    const urlObj = new URL(configuredApiUrl);
    configuredHost = urlObj.hostname;
    configuredProtocol = urlObj.protocol;
  } catch (e) {
    console.error('Invalid API_URL format:', configuredApiUrl);
    configuredHost = 'localhost'; // Fallback
    configuredProtocol = 'http:'; // Fallback
  }

  // Check if we're using localhost in the configured URL
  const isLocalhost = configuredHost === 'localhost' || configuredHost === '127.0.0.1';
  
  // If we're not using localhost, just use the configured URL
  if (!isLocalhost) {
    console.log('Using configured API URL:', configuredApiUrl);
    return configuredApiUrl;
  }
  
  // If we are using localhost, we should check if we're accessing from a different device
  // Use the current window location hostname and protocol
  const currentHost = window.location.hostname;
  const currentProtocol = window.location.protocol;
  
  // If we're not accessing via localhost/127.0.0.1, replace the host in the API URL
  // Or if the protocol doesn't match (HTTP vs HTTPS), use the current protocol
  if ((currentHost !== 'localhost' && currentHost !== '127.0.0.1' && currentHost !== '') || 
      (window.location.protocol === 'https:' && configuredProtocol === 'http:')) {
    try {
      const urlObj = new URL(configuredApiUrl);
      
      // Update hostname if we're on a different device
      if (currentHost !== 'localhost' && currentHost !== '127.0.0.1' && currentHost !== '') {
        urlObj.hostname = currentHost;
      }
      
      // Use HTTPS if the frontend is using HTTPS (only when on the same host)
      // This helps with mixed content blocking when the frontend is on HTTPS
      if (currentHost === urlObj.hostname && currentProtocol === 'https:') {
        urlObj.protocol = 'https:';
        console.log('Frontend using HTTPS, updating API URL to use HTTPS');
      }
      
      const newApiUrl = urlObj.toString();
      console.log(`Adjusted API URL: ${newApiUrl}`);
      return newApiUrl;
    } catch (e) {
      console.error('Error creating new API URL:', e);
      return configuredApiUrl; // Fallback to configured URL
    }
  }
  
  // Otherwise, just use the configured URL
  console.log('Using default API URL:', configuredApiUrl);
  return configuredApiUrl;
};

// Get the API URL based on our strategy
const API_URL = determineApiUrl();

// Clean the API URL to ensure it doesn't have trailing slashes
const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Export configuration object
const config = {
  // API base URL - in development this will be the local server
  // in production, this will be configured through environment variables
  apiUrl: cleanApiUrl,
  
  // Version info
  version: process.env.REACT_APP_VERSION || '0.1.0',
  
  // Feature flags
  features: {
    enableDebugLogging: process.env.NODE_ENV === 'development',
  }
};

console.log('Application config:', config);

export default config;
