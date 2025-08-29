/**
 * Application configuration with environment-specific settings
 */

// Function to determine the best API URL to use
const determineApiUrl = () => {
  // Get the configured API URL from environment variables with fallback
  const configuredApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Parse the configured URL to get its host
  let configuredHost;
  try {
    const urlObj = new URL(configuredApiUrl);
    configuredHost = urlObj.hostname;
  } catch (e) {
    console.error('Invalid API_URL format:', configuredApiUrl);
    configuredHost = 'localhost'; // Fallback
  }

  // Check if we're using localhost in the configured URL
  const isLocalhost = configuredHost === 'localhost' || configuredHost === '127.0.0.1';
  
  // If we're not using localhost, just use the configured URL
  if (!isLocalhost) {
    console.log('Using configured API URL:', configuredApiUrl);
    return configuredApiUrl;
  }
  
  // If we are using localhost, we should check if we're accessing from a different device
  // Use the current window location hostname (this will be the IP address when accessing from another device)
  const currentHost = window.location.hostname;
  
  // If we're not accessing via localhost/127.0.0.1, replace the host in the API URL
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1' && currentHost !== '') {
    try {
      const urlObj = new URL(configuredApiUrl);
      urlObj.hostname = currentHost;
      const newApiUrl = urlObj.toString();
      console.log(`Accessing from non-localhost (${currentHost}), using API URL: ${newApiUrl}`);
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
