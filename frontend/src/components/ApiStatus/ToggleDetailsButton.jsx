import React from 'react';
import styles from './ApiStatus.module.css';

/**
 * Toggle button for expanding/collapsing details panel
 */
const ToggleDetailsButton = ({ expanded, onClick }) => (
  <button 
    onClick={onClick}
    className={styles.toggleButton}
  >
    {expanded ? 'Hide Details' : 'Show Details'}
  </button>
);

export default ToggleDetailsButton;