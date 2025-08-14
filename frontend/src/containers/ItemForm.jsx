import { useEffect, useState, useRef } from 'react';
import axios from 'axios'; // Keep for axios.isCancel
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { api } from '../utils/authUtils';

// Component for handling camera capture functionality
const CameraCapture = ({ onCapture, onCancel }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Initialize camera on component mount
  useEffect(() => {
    startCamera();
    // Clean up on unmount
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access not supported in this browser');
      return;
    }
    
    try {
      // Request camera access with options for rear camera if available
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to actually start playing
        videoRef.current.onloadeddata = () => {
          setIsStreaming(true);
        };
        
        // Start playing the video
        try {
          await videoRef.current.play();
        } catch (err) {
          console.error('Failed to play video stream:', err);
          setCameraError('Could not play video stream. Please check camera permissions.');
        }
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Failed to access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.onloadeddata = null;
    }
    
    setIsStreaming(false);
  };

  const handleTakePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setCameraError('Camera is not ready');
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob(blob => {
        if (!blob) {
          setCameraError('Failed to capture image');
          return;
        }
        
        // Create file from blob
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        
        // Pass the captured photo back to parent component
        onCapture(file);
      }, 'image/jpeg', 0.92);
    } catch (err) {
      console.error('Error capturing photo:', err);
      setCameraError('Failed to capture photo');
    }
  };

  return (
    <div className="camera-capture mt-3">
      {cameraError && (
        <div className="alert alert-danger">{cameraError}</div>
      )}
      
      <div className="position-relative mb-3">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          style={{ 
            width: '100%', 
            borderRadius: '8px',
            background: '#000',
            display: 'block'
          }}
        />
        
        {!isStreaming && (
          <div 
            className="position-absolute top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          >
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Loading camera...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="d-flex justify-content-between mt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleTakePhoto} 
          disabled={!isStreaming}
        >
          Take Photo
        </Button>
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

// Component for handling photo uploads
const PhotoUpload = ({ initialData, onPhotoUpload, currentPhotoUrl }) => {
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = async (file) => {
    if (!file || !initialData?.id) return;
    
    setPhotoError(null);
    setPhotoUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('photos[]', file);
      
      const res = await api.post(`/items/${initialData.id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const filename = res?.data?.filename;
      if (filename) {
        onPhotoUpload(`/uploads/${filename}`);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setPhotoError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setPhotoUploading(false);
      setCapturedPhoto(null);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleCameraCapture = (file) => {
    // Create temporary URL for preview
    const objectUrl = URL.createObjectURL(file);
    setCapturedPhoto({
      file: file,
      previewUrl: objectUrl
    });
    
    // Don't automatically upload - wait for user to save the form
    setShowCamera(false);
    onPhotoUpload(objectUrl); // Set temporary preview
  };

  // Handle saving the captured photo
  const handleSavePhoto = () => {
    if (capturedPhoto?.file) {
      handlePhotoUpload(capturedPhoto.file);
    }
  };

  // Handle discarding the captured photo
  const handleDiscardPhoto = () => {
    if (capturedPhoto?.previewUrl) {
      URL.revokeObjectURL(capturedPhoto.previewUrl);
    }
    setCapturedPhoto(null);
    setShowCamera(false);
    // Restore original photo URL
    if (currentPhotoUrl && !currentPhotoUrl.startsWith('blob:')) {
      onPhotoUpload(currentPhotoUrl);
    } else {
      onPhotoUpload(null);
    }
  };

  return (
    <div className="photo-upload mb-3">
      <label className="form-label">Item Image</label>
      
      {showCamera ? (
        <CameraCapture 
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      ) : capturedPhoto ? (
        <div className="mb-3">
          <img 
            src={capturedPhoto.previewUrl} 
            alt="Captured" 
            style={{ 
              width: '100%', 
              maxHeight: 280, 
              objectFit: 'cover', 
              borderRadius: 12 
            }} 
          />
          <div className="d-flex gap-2 mt-2">
            <Button variant="outline-danger" onClick={handleDiscardPhoto} className="flex-grow-1">
              Discard
            </Button>
            <Button variant="primary" onClick={handleSavePhoto} className="flex-grow-1">
              Use Photo
            </Button>
          </div>
        </div>
      ) : currentPhotoUrl && !photoUploading ? (
        <div className="mb-3">
          <img 
            src={currentPhotoUrl} 
            alt="Item" 
            style={{ 
              width: '100%', 
              maxHeight: 280, 
              objectFit: 'cover', 
              borderRadius: 12 
            }} 
          />
          <div className="d-flex align-items-center gap-2 mt-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="form-control"
              onChange={handleFileInputChange}
              disabled={photoUploading}
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              onClick={() => setShowCamera(true)}
              disabled={photoUploading}
            >
              Camera
            </Button>
          </div>
        </div>
      ) : (
        <div className="d-flex align-items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="form-control"
            onChange={handleFileInputChange}
            disabled={photoUploading}
            style={{ flex: 1 }}
          />
          <Button
            type="button"
            onClick={() => setShowCamera(true)}
            disabled={photoUploading}
          >
            Camera
          </Button>
        </div>
      )}
      
      {photoUploading && (
        <div className="alert alert-info mt-2">
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm me-2" role="status">
              <span className="visually-hidden">Uploading...</span>
            </div>
            <span>Uploading photo...</span>
          </div>
        </div>
      )}
      
      {photoError && (
        <div className="alert alert-danger mt-2">{photoError}</div>
      )}
    </div>
  );
};

// Main ItemForm component
const ItemForm = ({ show, onClose, onSave, initialData = null, autoUploadPhotoFile = null, onAutoUploadConsumed = null }) => {
  const [categories, setCategories] = useState([]);
  const [specFields, setSpecFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(initialData?.primary_photo_url || null);
  const [authInProgress, setAuthInProgress] = useState(false);
  const navigate = useNavigate();
  
  // auth state
  const isAuthenticated = useIsAuthenticated();
  
  // form state
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    specs: {},
  });

  // Fetch categories when form is visible
  useEffect(() => {
    if (show) {
      const controller = new AbortController();
      
      api.get('/categories', { signal: controller.signal })
        .then(res => {
          setCategories(res.data);
        })
        .catch(err => {
          if (!axios.isCancel(err)) {
            console.error('Error fetching categories:', err);
          }
        });
        
      return () => controller.abort();
    }
  }, [show]);

  // Initialize form with initialData when available
  useEffect(() => {
    if (initialData && show) {
      // Fetch the latest item data from the API when editing (if we have an ID)
      if (initialData.id) {
        const fetchItemData = async () => {
          try {
            const response = await api.get(`/items/${initialData.id}`);
            const itemData = response.data;
            
            // Extract specification values from the response
            const specValues = itemData.specification_values || {};
            
            setForm({
              name: itemData.name || '',
              category_id: itemData.category_id || '',
              specs: specValues,
            });
            setPhotoPreviewUrl(itemData.primary_photo ? `/uploads/${itemData.primary_photo}` : initialData.primary_photo_url);
          } catch (error) {
            console.error('Error fetching item data:', error);
            // Fallback to initialData if API request fails
            setForm({
              name: initialData.name || '',
              category_id: initialData.category_id || '',
              specs: initialData.specification_values || {},
            });
            setPhotoPreviewUrl(initialData.primary_photo_url || null);
          }
        };
        
        fetchItemData();
      } else {
        // For new items, just use the initialData
        setForm({
          name: initialData.name || '',
          category_id: initialData.category_id || '',
          specs: initialData.specification_values || {},
        });
        setPhotoPreviewUrl(initialData.primary_photo_url || null);
      }
    }
  }, [initialData, show]);

  // Reset form on each open
  useEffect(() => {
    if (show) {
      setError(null);
      setAuthInProgress(false);
      
      // Only initialize empty form when no initialData is provided
      // This avoids conflicts with the other useEffect that fetches data
      if (!initialData) {
        setForm({ name: '', category_id: '', specs: {} });
        setPhotoPreviewUrl(null);
      }
    }
  }, [show, initialData]);

  // Fetch specification fields when category changes
  useEffect(() => {
    if (form.category_id && show) {
      const controller = new AbortController();
      
      api
        .get(`/categories/${form.category_id}/specifications_schema`, { 
          signal: controller.signal 
        })
        .then(res => {
          // Handle different possible response formats
          let fields;
          
          if (Array.isArray(res.data)) {
            // Array format
            fields = res.data.map(spec => ({
              name: spec.key,
              label: spec.label || spec.key,
              type: spec.type || 'text',
              placeholder: spec.placeholder || '',
              display_order: spec.display_order
            }));
          } else if (typeof res.data === 'object' && !Array.isArray(res.data)) {
            // Object format
            fields = Object.entries(res.data).map(([key, spec]) => ({
              name: key,
              label: spec.label || key,
              type: spec.type || 'text',
              placeholder: spec.placeholder || '',
              display_order: spec.display_order
            }));
          } else {
            fields = [];
          }
          
          // Sort by display_order if available
          fields.sort((a, b) => {
            const orderA = a.display_order !== undefined ? a.display_order : 0;
            const orderB = b.display_order !== undefined ? b.display_order : 0;
            return orderA - orderB;
          });
          
          setSpecFields(fields);
        })
        .catch((error) => {
          if (!axios.isCancel(error)) {
            console.error('Error fetching specification fields:', error);
            setSpecFields([]);
          }
        });
        
      return () => controller.abort();
    } else {
      setSpecFields([]);
    }
  }, [form.category_id, show]);

  // Handle form field change
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Handle specification field change
  const handleSpecChange = (field, value) => {
    setForm(f => ({ ...f, specs: { ...f.specs, [field]: value } }));
  };

  // Handle photo upload
  const handlePhotoUploaded = (url) => {
    // Only update the state URL if not null or a blob URL (temp preview)
    if (url !== null) {
      setPhotoPreviewUrl(url);
    }
  };

  // Handle form submission
  const handleSubmit = async (e, skipAuthCheck = false) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Check authentication status before proceeding
    if (!skipAuthCheck && !isAuthenticated && !authInProgress) {
      setAuthInProgress(true);
      // Get the current location to redirect back after login
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }
    
    // Reset auth progress state
    setAuthInProgress(false);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare payload with properly formatted data
      const payload = {
        name: form.name,
        category_id: form.category_id,
        specification_values: form.specs || {}
      };
      
      // Set the appropriate content type for JSON data
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (initialData && initialData.id) {
        const res = await api.put(`/items/${initialData.id}`, JSON.stringify(payload), config);
        setIsLoading(false);
        onSave(res?.data || initialData);
      } else {
        const res = await api.post('/items', JSON.stringify(payload), config);
        setIsLoading(false);
        onSave(res?.data);
      }
    } catch (error) {
      console.error('Error submitting item:', error);
      setIsLoading(false);
      setError(error.response?.data?.error || 'An error occurred while saving the item. Please try again.');
    }
  };

  // Auto-upload provided photo file when in edit mode
  useEffect(() => {
    if (show && initialData?.id && autoUploadPhotoFile instanceof File) {
      const uploadFile = async () => {
        try {
          const formData = new FormData();
          formData.append('photos[]', autoUploadPhotoFile);
          
          const res = await api.post(`/items/${initialData.id}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          const filename = res?.data?.filename;
          if (filename) {
            setPhotoPreviewUrl(`/uploads/${filename}`);
          }
        } catch (err) {
          console.error('Error auto-uploading photo:', err);
        } finally {
          if (onAutoUploadConsumed) {
            onAutoUploadConsumed();
          }
        }
      };
      
      uploadFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, initialData?.id, autoUploadPhotoFile]);

  return (
    <Modal show={show} title={initialData ? 'Edit Item' : 'New Item'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Category selection */}
        <div className="mb-2">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        
        {/* Item name */}
        <div className="mb-2">
          <Input
            name="name"
            value={form.name}
            onChange={handleChange}
            label="Name"
            placeholder="Item name"
            required
          />
        </div>
        
        {/* Dynamic specification fields */}
        {specFields.map(field => (
          <div className="mb-2" key={field.name}>
            <label className="form-label">{field.label}</label>
            <Input
              name={field.name}
              value={form.specs[field.name] || ''}
              onChange={e => handleSpecChange(field.name, e.target.value)}
              placeholder={field.label}
            />
          </div>
        ))}
        
        {/* Photo upload controls - only when editing an existing item */}
        {initialData && initialData.id && (
          <PhotoUpload 
            initialData={initialData} 
            onPhotoUpload={handlePhotoUploaded}
            currentPhotoUrl={photoPreviewUrl}
          />
        )}
        
        {/* Form actions */}
        <div className="mt-3 text-end">
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}
          <Button 
            variant="secondary" 
            type="button" 
            onClick={onClose} 
            className="me-2" 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ItemForm;
