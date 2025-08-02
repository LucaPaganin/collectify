import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';

const ItemForm = ({ show, onClose, onSave, initialData = null }) => {
  const [categories, setCategories] = useState([]);
  const [specFields, setSpecFields] = useState([]);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    serial: '',
    description: '',
    category_id: '',
    specs: {},
  });

  useEffect(() => {
    // fetch categories
    axios.get('/api/categories').then(res => {
      setCategories(res.data);
    });
  }, []);

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
    if (form.category_id) {
      axios
        .get(`/api/categories/${form.category_id}/specifications_schema`)
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
          console.error('Error fetching specification fields:', error);
          setSpecFields([]);
        });
    } else {
      setSpecFields([]);
    }
  }, [form.category_id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSpecChange = (field, value) => {
    setForm(f => ({ ...f, specs: { ...f.specs, [field]: value } }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
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
      
      onSave();
    } catch (error) {
      console.error('Error submitting item:', error);
      // You could add error handling here, such as displaying an error message
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
        <div className="mb-2">
          <Input
            name="brand"
            value={form.brand}
            onChange={handleChange}
            label="Brand"
            placeholder="Item brand (optional)"
          />
        </div>
        <div className="mb-2">
          <Input
            name="serial"
            value={form.serial}
            onChange={handleChange}
            label="Serial Number"
            placeholder="Serial number (optional)"
          />
        </div>
        <div className="mb-2">
          <Input
            name="description"
            value={form.description}
            onChange={handleChange}
            label="Description"
            placeholder="Item description (optional)"
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
          <Button variant="secondary" type="button" onClick={onClose} className="me-2">Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ItemForm;
