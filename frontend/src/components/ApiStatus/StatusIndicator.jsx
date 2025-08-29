import React from 'react';
import styles from './ApiStatus.module.css';

/**
 * Status indicator component showing connection state with a colored dot
 */
const StatusIndicator = ({ status }) => {
  let indicatorClass = styles.indicator;
  
  if (status.loading) {
    indicatorClass += ` ${styles.loading}`;
  } else if (status.connected) {
    indicatorClass += ` ${styles.connected}`;
  } else {
    indicatorClass += ` ${styles.disconnected}`;
  }
  
  return <div className={indicatorClass}></div>;
};

export default StatusIndicator;