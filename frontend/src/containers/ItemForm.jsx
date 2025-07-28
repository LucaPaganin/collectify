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
        .get(`/api/categories/${form.category_id}/specs`)
        .then(res => setSpecFields(res.data))
        .catch(() => setSpecFields([]));
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
    const payload = { ...form };
    if (initialData && initialData.id) {
      await axios.put(`/api/items/${initialData.id}`, payload);
    } else {
      await axios.post('/api/items', payload);
    }
    onSave();
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
          >
            <option value="">Select category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label className="form-label">Name</label>
          <Input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Item name"
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Brand</label>
          <Input
            name="brand"
            value={form.brand}
            onChange={handleChange}
            placeholder="Brand"
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Serial #</label>
          <Input
            name="serial"
            value={form.serial}
            onChange={handleChange}
            placeholder="Serial number"
          />
        </div>
        <div className="mb-2">
          <label className="form-label">Extra info / Notes</label>
          <Input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
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
