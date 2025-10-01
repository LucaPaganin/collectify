import React, { useState, useEffect, useRef } from 'react';
import CameraFeed from './CameraFeed';
import CameraControls from './CameraControls';
import CameraError from './CameraError';
import CompatibilityChecker from './CompatibilityChecker';
import { isMobileDevice } from '../../utils/camera/cameraUtils';
import styles from './Camera.module.css';

const Camera = ({ onCapture, onError, onCancel }) => {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' is rear camera
  const [hasFrontCamera, setHasFrontCamera] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize camera on component mount
  useEffect(() => {
    initCamera();
    
    // Cleanup function to stop all tracks when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, initCamera, stream]); // Re-initialize when facingMode changes

  // Check for available camera devices
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log("enumerateDevices() not supported.");
      return;
    }

    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setHasFrontCamera(videoInputs.length > 1);
        
        // Log available devices for debugging
        console.log('Available video devices:', videoInputs.length);
        if (videoInputs.length > 0 && videoInputs[0].label) {
          console.log('Camera labels:', videoInputs.map(d => d.label));
        }
      })
      .catch(err => {
        console.error("Error enumerating devices:", err);
      });
  }, []);

  const initCamera = async () => {
    // Reset any previous errors
    setError(null);
    setIsInitializing(true);
    
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access.');
      }

      // Mobile-specific options
      const isMobile = isMobileDevice();
      
      // Create constraints with mobile-specific optimizations
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: isMobile ? 720 : 1280 },
          height: { ideal: isMobile ? 1280 : 720 }
        }
      };
      
      // Add advanced mobile settings if needed
      if (isMobile) {
        // Some mobile browsers work better with specific settings
        constraints.video.frameRate = { ideal: 30 };
      }
      
      // Attempt to get the camera stream
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setStream(mediaStream);
      
      // Log success for debugging
      console.log('Camera initialized successfully with facing mode:', facingMode);
      
    } catch (err) {
      console.error('Camera initialization error:', err);
      
      // Set error state for UI display
      setError(err);
      
      // Call parent error handler if provided
      if (onError) {
        onError(err);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to the canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob(blob => {
      if (onCapture && blob) {
        // Create a File object from the blob with a more descriptive filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `collectify-photo-${timestamp}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      }
    }, 'image/jpeg', 0.85); // Slightly reduced quality for better performance
  };

  const handleSwitchCamera = () => {
    // Toggle between front and rear camera
    setFacingMode(prevMode => 
      prevMode === 'environment' ? 'user' : 'environment'
    );
  };

  // If there's an error, show the error component
  if (error) {
    return (
      <div>
        <CameraError error={error} />
        <div className="d-flex justify-content-between mt-3">
          {onCancel && (
            <button 
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={initCamera}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Check for browser compatibility */}
      <CompatibilityChecker />
      
      {/* Loading indicator */}
      {isInitializing && (
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Initializing camera...</span>
          </div>
          <p className="mt-2">Initializing camera...</p>
        </div>
      )}
      
      {/* Camera feed */}
      {stream && !isInitializing && (
        <CameraFeed stream={stream} videoRef={videoRef} />
      )}
      
      {/* Camera controls */}
      {stream && !isInitializing && (
        <CameraControls 
          onCapture={handleCapture} 
          onSwitchCamera={handleSwitchCamera}
          hasFrontCamera={hasFrontCamera}
        />
      )}
      
      {/* Cancel button */}
      {onCancel && !isInitializing && (
        <div className="d-flex justify-content-center mt-3">
          <button 
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      )}
      
      {/* Hidden canvas for capturing images */}
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default Camera;