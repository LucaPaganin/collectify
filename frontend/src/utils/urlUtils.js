import { api } from './authUtils';

/**
 * Gets the base URL for the API, removing the '/api' suffix if present.
 * This is useful for constructing full URLs for static assets like images.
 * @returns {string} The base URL
 */
export const getApiBaseUrl = () => {
  if (!api.defaults.baseURL) return '';
  return api.defaults.baseURL.replace('/api', '');
};
