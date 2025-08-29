import React, { useState, useEffect } from 'react';
import { testApiConnection } from '../../utils/connectionUtils';
import styles from './ApiStatus.module.css';

// Import sub-components
import StatusIndicator from './StatusIndicator';
import StatusLabel from './StatusLabel';
import ToggleDetailsButton from './ToggleDetailsButton';
import ApiDetails from './ApiDetails';

/**
 * Main API Status component that monitors and displays API connection status
 */
const ApiStatus = ({ visible = false }) => {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    details: null,
    lastChecked: null
  });
  
  const [expanded, setExpanded] = useState(false);
  
  // Check API connection on mount and periodically
  useEffect(() => {
    if (!visible) return; // Don't run if not visible
    
    const checkConnection = async () => {
      setStatus(prev => ({ ...prev, loading: true }));
      
      try {
        const result = await testApiConnection();
        setStatus({
          loading: false,
          connected: result.connectionStatus === 'success',
          details: result,
          lastChecked: new Date()
        });
      } catch (error) {
        setStatus({
          loading: false,
          connected: false,
          details: { error: error.message },
          lastChecked: new Date()
        });
      }
    };
    
    // Check immediately
    checkConnection();
    
    // Then check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [visible]);

  const handleCheckNow = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    const result = await testApiConnection();
    setStatus({
      loading: false,
      connected: result.connectionStatus === 'success',
      details: result,
      lastChecked: new Date()
    });
  };
  
  if (!visible) return null;
  
  return (
    <div className={styles.container}>
      <div className={styles.statusBar} style={{ marginBottom: expanded ? '10px' : '0' }}>
        <div className={styles.statusInfo}>
          <StatusIndicator status={status} />
          <StatusLabel status={status} />
        </div>
        <ToggleDetailsButton 
          expanded={expanded} 
          onClick={() => setExpanded(!expanded)} 
        />
      </div>
      
      {expanded && (
        <ApiDetails 
          status={status} 
          onCheckNow={handleCheckNow} 
        />
      )}
    </div>
  );
};

export default ApiStatus;