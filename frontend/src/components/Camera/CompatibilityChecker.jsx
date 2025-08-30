import React, { useEffect, useState } from 'react';
import styles from './Camera.module.css';
import { 
  getCameraCapabilities, 
  getCameraIssueAdvice 
} from '../../utils/camera/cameraUtils';

const CompatibilityChecker = () => {
  const [capabilities, setCapabilities] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const caps = await getCameraCapabilities();
        setCapabilities(caps);
        
        // Only show advice if there are issues
        if (!caps.isSupported || 
            !caps.isSecureContext || 
            !caps.isSupportedBrowser || 
            caps.availableCameras === 0 ||
            caps.inIframe) {
          setAdvice(getCameraIssueAdvice(caps));
        }
      } catch (error) {
        console.error('Error checking capabilities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkCapabilities();
  }, []);

  // Show nothing while loading or if no issues detected
  if (loading || !advice) {
    return null;
  }

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorTitle}>{advice.title}</div>
      <div className={styles.errorMessage}>{advice.message}</div>
      <div className={styles.errorSolution}>{advice.solution}</div>
      
      {/* Add detailed diagnostics in development mode */}
      {process.env.NODE_ENV === 'development' && capabilities && (
        <div className="mt-3 border-top pt-2">
          <small className="text-muted">Diagnostic Information:</small>
          <ul className="small text-muted mb-0">
            <li>Browser supports camera: {capabilities.isSupported ? 'Yes' : 'No'}</li>
            <li>Secure context: {capabilities.isSecureContext ? 'Yes' : 'No'}</li>
            <li>Supported browser: {capabilities.isSupportedBrowser ? 'Yes' : 'No'}</li>
            <li>Mobile device: {capabilities.isMobileDevice ? 'Yes' : 'No'}</li>
            <li>Cameras detected: {capabilities.availableCameras}</li>
            <li>Running in iframe: {capabilities.inIframe ? 'Yes' : 'No'}</li>
            <li>User agent: {navigator.userAgent}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompatibilityChecker;