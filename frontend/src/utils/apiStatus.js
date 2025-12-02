import { testApiConnection, suggestAlternativeApiUrl } from './connectionUtils';

/**
 * Resolves the API status by testing the connection and suggesting alternatives if needed
 * @returns {Promise<Object>} API status object with checked, connected, and suggestedUrl properties
 */
export const resolveApiStatus = async () => {
    const status = {
        checked: true,
        connected: false,
        suggestedUrl: null
    };

    try {
        // Test the API connection
        const result = await testApiConnection();

        // Set the connection status
        status.connected = result.connectionStatus === 'success';

        // If connection failed, try to suggest an alternative URL
        if (!status.connected) {
            status.suggestedUrl = suggestAlternativeApiUrl();
        }

        return status;
    } catch (error) {
        console.error('Error resolving API status:', error);

        // Even on error, try to suggest an alternative URL
        status.suggestedUrl = suggestAlternativeApiUrl();

        return status;
    }
};

export default resolveApiStatus;
