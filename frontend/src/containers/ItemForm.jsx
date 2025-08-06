import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useAuthUser, useIsAuthenticated } from 'react-auth-kit';

const ItemForm = ({ show, onClose, onSave, initialData = null }) => {
  const [categories, setCategories] = useState([]);
  const [specFields, setSpecFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authInProgress, setAuthInProgress] = useState(false);
  const navigate = useNavigate();
  
  // auth state
  const auth = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const currentUser = auth();
  
  // form state
  const [form, setForm] = useState({
    name: '',
    brand: '',
    serial: '',
    description: '',
    category_id: '',
    specs: {},
  });

  useEffect(() => {
    // Only fetch categories when the form is visible
    if (show) {
      const controller = new AbortController();
      
      axios.get('/api/categories', { signal: controller.signal })
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
        brand: initialData.brand || '',
        serial: initialData.serial || '',
        description: initialData.description || '',
        category_id: initialData.category_id || '',
        specs: initialData.specs || {},
      });
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
          brand: initialData.brand || '',
          serial: initialData.serial || '',
          description: initialData.description || '',
          category_id: initialData.category_id || '',
          specs: initialData.specs || {},
        });
      } else {
        setForm({ name: '', brand: '', serial: '', description: '', category_id: '', specs: {} });
      }
    }
  }, [show, initialData]);

  useEffect(() => {
    if (form.category_id && show) {
      const controller = new AbortController();
      
      axios
        .get(`/api/categories/${form.category_id}/specifications_schema`, { 
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
        brand: form.brand || '',  // Include brand as optional
        serial_number: form.serial || '',  // Include serial number as optional
        description: form.description || '',  // Include description as optional
        specification_values: form.specs || {}  // Ensure specs are included
      };
      
      // Set the appropriate content type for JSON data
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (initialData && initialData.id) {
        await axios.put(`/api/items/${initialData.id}`, JSON.stringify(payload), config);
      } else {
        await axios.post('/api/items', JSON.stringify(payload), config);
      }
      
      setIsLoading(false);
      onSave();
    } catch (error) {
      console.error('Error submitting item:', error);
      setIsLoading(false);
      setError(error.response?.data?.error || 'An error occurred while saving the item. Please try again.');
    }
  };

  return (
    <Modal show={show} title={initialData ? 'Edit Item' : 'New Item'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
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
