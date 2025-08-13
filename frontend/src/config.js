/**
 * Application configuration with environment-specific settings
 */

// Get the environment variables with fallbacks for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Export configuration object
const config = {
  // API base URL - in development this will be the local server
  // in production, this will be configured through environment variables
  apiUrl: API_URL,
  
  // Version info
  version: process.env.REACT_APP_VERSION || '0.1.0',
  
  // Feature flags
  features: {
    enableDebugLogging: process.env.NODE_ENV === 'development',
  }
};

export default config;
