/**
 * Camera capability detection utilities
 */

/**
 * Check if the browser supports camera access
 * @returns {boolean}
 */
export const isCameraSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Check if the browser is running in a secure context (required for camera access)
 * @returns {boolean}
 */
export const isSecureContext = () => {
  return window.isSecureContext === true;
};

/**
 * Check if the current browser is likely to support camera access
 * @returns {boolean}
 */
export const isSupportedBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    /chrome/.test(userAgent) ||
    /firefox/.test(userAgent) ||
    /safari/.test(userAgent) ||
    /edge/.test(userAgent)
  );
};

/**
 * Check if the device is likely a mobile device
 * @returns {boolean}
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Get detailed camera support information
 * @returns {Object} An object with various camera support properties
 */
export const getCameraCapabilities = async () => {
  const result = {
    isSupported: isCameraSupported(),
    isSecureContext: isSecureContext(),
    isSupportedBrowser: isSupportedBrowser(),
    isMobileDevice: isMobileDevice(),
    hasMediaDevices: !!navigator.mediaDevices,
    inIframe: window !== window.top,
    availableCameras: 0,
    hasFrontCamera: false,
    hasRearCamera: false,
  };

  // Only check for cameras if the browser supports media devices
  if (result.isSupported) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === 'videoinput');
      
      result.availableCameras = cameras.length;
      
      // Try to determine if we have front/rear cameras
      if (cameras.length > 0) {
        // First check if we can get specific labels
        if (cameras[0].label) {
          // If we have labels, look for common naming patterns
          result.hasFrontCamera = cameras.some(camera => 
            /front|user|face/i.test(camera.label)
          );
          
          result.hasRearCamera = cameras.some(camera => 
            /back|rear|environment/i.test(camera.label)
          );
        } else {
          // If no labels, assume:
          // - If only one camera, it's front on desktop and rear on mobile
          // - If multiple cameras, assume we have both
          if (cameras.length === 1) {
            if (result.isMobileDevice) {
              result.hasRearCamera = true;
            } else {
              result.hasFrontCamera = true;
            }
          } else if (cameras.length > 1) {
            result.hasFrontCamera = true;
            result.hasRearCamera = true;
          }
        }
      }
    } catch (error) {
      console.error('Error checking camera capabilities:', error);
    }
  }

  return result;
};

/**
 * Get readable advice for camera issues based on detected capabilities
 * @param {Object} capabilities The camera capabilities object
 * @returns {Object} An object with title, message, and solution properties
 */
export const getCameraIssueAdvice = (capabilities) => {
  if (!capabilities.isSupported) {
    return {
      title: 'Camera Not Supported',
      message: 'Your browser doesn\'t support camera access.',
      solution: 'Try using a modern browser like Chrome, Firefox, or Safari.'
    };
  }
  
  if (!capabilities.isSecureContext) {
    return {
      title: 'Insecure Context',
      message: 'Camera access requires a secure connection (HTTPS).',
      solution: 'Access this site using HTTPS instead of HTTP.'
    };
  }
  
  if (capabilities.inIframe) {
    return {
      title: 'Embedded Content Restriction',
      message: 'Camera access is restricted in embedded pages.',
      solution: 'Try accessing this page directly instead of in an embedded frame.'
    };
  }
  
  if (!capabilities.isSupportedBrowser) {
    return {
      title: 'Unsupported Browser',
      message: 'Your browser may not fully support camera access.',
      solution: 'Try using Chrome, Firefox, or Safari for better compatibility.'
    };
  }
  
  if (capabilities.availableCameras === 0) {
    return {
      title: 'No Camera Detected',
      message: 'No camera was detected on your device.',
      solution: 'Check that your camera is connected and not in use by another application.'
    };
  }
  
  return {
    title: 'Camera Permission Required',
    message: 'You need to allow camera access to use this feature.',
    solution: 'When prompted, click "Allow" to give access to your camera.'
  };
};