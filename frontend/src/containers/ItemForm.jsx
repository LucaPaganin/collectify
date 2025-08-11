import { useEffect, useState, useRef } from 'react';
import axios from 'axios'; // Keep for axios.isCancel
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { api } from '../utils/authUtils';

const ItemForm = ({ show, onClose, onSave, initialData = null, autoUploadPhotoFile = null, onAutoUploadConsumed = null }) => {
  const [categories, setCategories] = useState([]);
  const [specFields, setSpecFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(initialData?.primary_photo_url || null);
  const [authInProgress, setAuthInProgress] = useState(false);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();
  
  // auth state
  const isAuthenticated = useIsAuthenticated();
  
  // form state
  const [form, setForm] = useState({
    name: '',
    category_id: '',
    specs: {},
  });

  useEffect(() => {
    // Only fetch categories when the form is visible
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

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        category_id: initialData.category_id || '',
        specs: initialData.specs || {},
      });
  setPhotoPreviewUrl(initialData.primary_photo_url || null);
    }
  }, [initialData]);

  // Reset form on each open (show true)
  useEffect(() => {
    if (show) {
      setError(null);
      setAuthInProgress(false);
      if (initialData) {
        setForm({
          name: initialData.name || '',
          category_id: initialData.category_id || '',
          specs: initialData.specs || {},
        });
  setPhotoPreviewUrl(initialData.primary_photo_url || null);
      } else {
        setForm({ name: '', category_id: '', specs: {} });
  setPhotoPreviewUrl(null);
      }
    }
  }, [show, initialData]);

  useEffect(() => {
    if (form.category_id && show) {
      const controller = new AbortController();
      
      api
        .get(`/categories/${form.category_id}/specifications_schema`, { 
          signal: controller.signal 
        })
        .then(res => {
          // Handle different possible response formats
          let specFields;
          if (Array.isArray(res.data)) {
            // Array format
            specFields = res.data.map(spec => ({
              name: spec.key,
              label: spec.label || spec.key,
              type: spec.type || 'text',
              placeholder: spec.placeholder || ''
            }));
          } else if (typeof res.data === 'object' && !Array.isArray(res.data)) {
            // Object format
            specFields = Object.entries(res.data).map(([key, spec]) => ({
              name: key,
              label: spec.label || key,
              type: spec.type || 'text',
              placeholder: spec.placeholder || ''
            }));
          } else {
            specFields = [];
          }
          
          // Sort by display_order if available
          specFields.sort((a, b) => {
            const orderA = a.display_order !== undefined ? a.display_order : 0;
            const orderB = b.display_order !== undefined ? b.display_order : 0;
            return orderA - orderB;
          });
          
          setSpecFields(specFields);
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

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSpecChange = (field, value) => {
    setForm(f => ({ ...f, specs: { ...f.specs, [field]: value } }));
  };

  const handleSubmit = async (e, skipAuthCheck = false) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Check authentication status before proceeding, but skip if coming from login success
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

  // Upload a single photo (available in edit mode)
  const handlePhotoUpload = async (e) => {
    const file = e?.target?.files ? e.target.files[0] : e; // support direct File param
    if (!file || !(initialData && initialData.id)) return;
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('photos[]', file);
      const res = await api.post(`/items/${initialData.id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPhotoUploading(false);
      const filename = res?.data?.filename;
      if (filename) {
        setPhotoPreviewUrl(`/uploads/${filename}`);
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setPhotoUploading(false);
      setPhotoError(err.response?.data?.error || 'Failed to upload image.');
    }
  };

  // Auto-upload provided photo file when in edit mode
  useEffect(() => {
    if (show && initialData?.id && autoUploadPhotoFile instanceof File) {
      handlePhotoUpload(autoUploadPhotoFile).finally(() => {
        if (onAutoUploadConsumed) onAutoUploadConsumed();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, initialData?.id, autoUploadPhotoFile]);

  return (
    <Modal show={show} title={initialData ? 'Edit Item' : 'New Item'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Always show current photo (or placeholder) when viewing/editing an existing item */}
        {initialData && photoPreviewUrl && (
          <div className="mb-3">
            <img src={photoPreviewUrl} alt="Item" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 12 }} />
          </div>
        )}
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
        {/* Photo upload controls only when editing an existing item */}
        {initialData && initialData.id && (
          <div className="mb-3">
            <label className="form-label">Add image</label>
            <div className="d-flex align-items-center gap-2">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="form-control"
                onChange={handlePhotoUpload}
                disabled={photoUploading}
                style={{ flex: 1 }}
              />
              <Button
                type="button"
                onClick={() => cameraInputRef.current && cameraInputRef.current.click()}
                disabled={photoUploading}
              >
                Camera
              </Button>
            </div>
            {/* hidden input that forces camera capture on supported devices */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (f) handlePhotoUpload(f);
                // reset so selecting the same file again re-triggers change
                e.target.value = '';
              }}
            />
            {photoUploading && (
              <div className="form-text">Uploading...</div>
            )}
            {photoError && (
              <div className="text-danger small mt-1">{photoError}</div>
            )}
          </div>
        )}
        <div className="mt-3 text-end">
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}
          <Button variant="secondary" type="button" onClick={onClose} className="me-2" disabled={isLoading}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ItemForm;
