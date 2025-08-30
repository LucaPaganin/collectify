import React, { useEffect, useRef } from 'react';
import styles from './Camera.module.css';

const CameraFeed = ({ stream, videoRef }) => {
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className={styles.cameraContainer}>
      <video 
        ref={videoRef}
        className={styles.videoFeed}
        autoPlay
        playsInline
        muted
      />
    </div>
  );
};

export default CameraFeed;