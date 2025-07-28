import React, { useState } from 'react';
import axios from 'axios';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ItemForm from './ItemForm';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(null);

  const search = async () => {
    const res = await axios.get(`/api/items?search=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`);
    setResults(res.data);
  };

  const openNew = () => { setFormData(null); setFormOpen(true); };
  const openEdit = item => { setFormData(item); setFormOpen(true); };
  const handleSave = () => { setFormOpen(false); search(); };

  return (
    <div className="container mt-4">
      <div className="d-flex mb-3">
        <input
          type="text"
          className="form-control me-2"
          placeholder="Search items..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select className="form-select me-2" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {/* TODO: fetch categories */}
        </select>
        <Button onClick={search}>Search</Button>
      </div>

      <div>
        {results.length === 0 ? (
          <p>No results</p>
        ) : (
          <ul className="list-group">
            {results.map(item => (
              <li
                key={item.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{item.name}</span>
                <div>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSelectedItem(item);
                      setModalOpen(true);
                    }}
                  >
                    View
                  </Button>
                  <Button variant="link" onClick={() => openEdit(item)}>Edit</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button onClick={openNew} variant="success">New Item</Button>

      {selectedItem && (
        <Modal
          show={modalOpen}
          title={selectedItem.name}
          onClose={() => setModalOpen(false)}
        >
          <p><strong>Brand:</strong> {selectedItem.brand}</p>
          <p><strong>Serial #:</strong> {selectedItem.serial}</p>
          <p><strong>Extra info / Notes:</strong> {selectedItem.description}</p>
          {/* TODO: images, specs */}
        </Modal>
      )}

      <ItemForm
        show={formOpen}
        initialData={formData}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default SearchPage;
