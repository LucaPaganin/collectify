import React from 'react';
import styles from './ApiStatus.module.css';
import config from '../../config';

/**
 * API details panel showing connection information and raw data
 */
const ApiDetails = ({ status, onCheckNow }) => (
  <div className={styles.detailsContainer}>
    <div className={styles.infoRow}>
      <strong>API URL:</strong> {config.apiUrl}
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
    <div className={styles.detailsContent}>
      {JSON.stringify(status.details, null, 2)}
    </div>
  </div>
);

export default ApiDetails;