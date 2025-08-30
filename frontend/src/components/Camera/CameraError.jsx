import React from 'react';
import styles from './Camera.module.css';
import { isMobileDevice } from '../../utils/camera/cameraUtils';

const CameraError = ({ error }) => {
  const isMobile = isMobileDevice();
  
  // Define error messages and solutions based on error type
  const getErrorDetails = (error) => {
    const errorType = error.name || 'UnknownError';
    const errorMessage = error.message || 'An unknown error occurred';
    
    const errorDetails = {
      NotFoundError: {
        title: 'Camera Not Found',
        message: 'We couldn\'t access your camera.',
        solution: isMobile 
          ? 'Make sure your device has a camera and it\'s not being used by another app.'
          : 'Make sure your camera is connected and not in use by another application.'
      },
      NotAllowedError: {
        title: 'Camera Access Denied',
        message: 'You\'ve denied permission to use your camera.',
        solution: isMobile
          ? 'Tap the URL/address bar and check camera permissions for this site, or go to your device settings.'
          : 'Click the camera icon in your browser\'s address bar to allow camera access, or check your browser settings.'
      },
      NotReadableError: {
        title: 'Camera In Use',
        message: 'Your camera is currently in use by another application.',
        solution: 'Close other applications that might be using your camera (like video call apps) and try again.'
      },
      OverconstrainedError: {
        title: 'Camera Constraints Not Satisfied',
        message: 'Your camera doesn\'t support the required settings.',
        solution: isMobile
          ? 'Try using your device\'s main camera.'
          : 'Try using a different camera if available.'
      },
      NotSupportedError: {
        title: 'Camera Not Supported',
        message: isMobile
          ? 'Your mobile browser doesn\'t support camera access.'
          : 'Your browser doesn\'t support camera access.',
        solution: isMobile
          ? 'Try using Chrome, Firefox, or Safari on iOS/Android.'
          : 'Try using a different browser like Chrome, Firefox, or Safari.'
      },
      AbortError: {
        title: 'Camera Access Aborted',
        message: 'The camera operation was aborted.',
        solution: 'Please try again. If the problem persists, try refreshing the page.'
      },
      SecurityError: {
        title: 'Security Error',
        message: 'Camera access was blocked due to security restrictions.',
        solution: 'Make sure you\'re using HTTPS or a secure context.'
      },
      TypeMismatchError: {
        title: 'Type Mismatch Error',
        message: 'The requested media type is not supported.',
        solution: 'Try using a different device or browser.'
      },
      default: {
        title: 'Camera Error',
        message: errorMessage,
        solution: 'Try refreshing the page or using a different device.'
      }
    };

    return errorDetails[errorType] || errorDetails.default;
  };

  const details = getErrorDetails(error);

  // Log detailed error info for debugging
  console.error('Camera Error:', {
    name: error.name,
    message: error.message,
    details: details,
    userAgent: navigator.userAgent,
    isMobile: isMobile
  });

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorTitle}>{details.title}</div>
      <div className={styles.errorMessage}>{details.message}</div>
      <div className={styles.errorSolution}>{details.solution}</div>
      
      {/* Add more details for debugging if needed */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-3 border-top pt-2">
          <small className="text-muted">Error details:</small>
          <ul className="small text-muted mb-0">
            <li>Error type: {error.name || 'Unknown'}</li>
            <li>Error message: {error.message || 'No message'}</li>
            <li>Mobile device: {isMobile ? 'Yes' : 'No'}</li>
            <li>Browser: {navigator.userAgent}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CameraError;