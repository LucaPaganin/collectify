import React from 'react';
import styles from './ApiStatus.module.css';
import config from '../../config';

/**
 * API details panel showing connection information and raw data
 */
const ApiDetails = ({ status, onCheckNow }) => {
  // Check if we're using HTTPS on frontend but HTTP for API
  const isHttpsMismatch = window.location.protocol === 'https:' && config.apiUrl.startsWith('http:');
  // Check if camera access might be affected by security context
  const isCameraRelevant = status.details?.error?.includes('getUserMedia') || 
                          status.details?.error?.includes('camera') ||
                          !status.connected;
  
  return (
    <div className={styles.detailsContainer}>
      <div className={styles.infoRow}>
        <strong>API URL:</strong> {config.apiUrl}
      </div>
      <div className={styles.infoRow}>
        <strong>Frontend Protocol:</strong> {window.location.protocol}
      </div>
      <div className={styles.infoRow}>
        <strong>Last Checked:</strong> {status.lastChecked?.toLocaleTimeString() || 'Never'}
      </div>
      <div className={styles.infoRow}>
        <button 
          onClick={onCheckNow}
          className={styles.checkButton}
        >
          Check Now
        </button>
      </div>
      
      {/* HTTPS Information */}
      {isHttpsMismatch && (
        <div className={styles.securityInfo || 'securityInfo'}>
          <h4>Security Context Mismatch</h4>
          <p>
            You're accessing the frontend over HTTPS, but the API is configured for HTTP.
            This can cause issues with camera access and other secure features.
          </p>
          <h5>Possible Solutions:</h5>
          <ol>
            <li>Configure the backend to use HTTPS as well (recommended)</li>
            <li>
              Switch to HTTP frontend: <a 
                href={window.location.href.replace('https:', 'http:')}
                className={styles.linkButton || 'linkButton'}
              >
                Access via HTTP instead
              </a>
            </li>
          </ol>
        </div>
      )}
      
      {/* Camera Access Information */}
      {isCameraRelevant && !isHttpsMismatch && window.location.protocol !== 'https:' && (
        <div className={styles.securityInfo || 'securityInfo'}>
          <h4>Camera Access Requires Secure Context</h4>
          <p>
            Modern browsers require HTTPS for camera access. If you're experiencing 
            camera issues, consider switching to HTTPS.
          </p>
          <p>
            Use the provided setup-https-dev.ps1 script to configure HTTPS for local development.
          </p>
        </div>
      )}
      
      <div className={styles.detailsContent}>
        {JSON.stringify(status.details, null, 2)}
      </div>
    </div>
  );
};

export default ApiDetails;