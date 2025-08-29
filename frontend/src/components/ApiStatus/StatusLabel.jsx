import React from 'react';

/**
 * Status label component displaying the current API connection status
 */
const StatusLabel = ({ status }) => (
  <span>
    API: {status.loading ? 'Checking...' : (status.connected ? 'Connected' : 'Disconnected')}
  </span>
);

export default StatusLabel;