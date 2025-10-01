import React, { useEffect } from 'react';
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
  }, [stream, videoRef]);

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