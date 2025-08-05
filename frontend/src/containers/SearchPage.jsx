import React, { useState, useCallback, useRef, useEffect } from 'react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ItemForm from './ItemForm';
import Navbar from '../components/Navbar';
import LoginModal from '../components/LoginModal';
import styles from './SearchPage.module.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cancellableGet, debounce } from '../utils/apiUtils';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef(null);
  
  // Cleanup function to cancel pending requests on unmount
  useEffect(() => {
    return () => {
      // This will be called when component unmounts
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Debounced search function to prevent multiple API calls
  const search = useCallback(async () => {
    setHasSearched(true);
    
    try {
      const res = await cancellableGet(
        `/api/items?search=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`,
        'searchItems'
      );
      setResults(res.data);
    } catch (err) {
      // Error is already logged in the utility
      setResults([]);
    }
  }, [query, category]);

  // Create a debounced version of the search function
  const debouncedSearch = useRef(
    debounce(() => {
      search();
    }, 500)
  ).current;

  const openNew = () => { 
    if (isAuthenticated) {
      setFormData(null); 
      setFormOpen(true); 
    } else {
      setLoginPromptOpen(true);
    }
  };
  const openEdit = item => { 
    if (isAuthenticated) {
      setFormData(item); 
      setFormOpen(true); 
    } else {
      setLoginPromptOpen(true);
    }
  };
  
  const handleSave = () => { 
    setFormOpen(false);
    // Call the actual search function, not the debounced version
    search(); 
  };

  return (
    <>
      <Navbar />
      <div className={styles.searchPageBg}>
        <div className={styles.searchCard}>
          <div className={styles.searchTitle}>Add an item</div>
          <form 
            className={styles.searchForm} 
            onSubmit={e => { 
              e.preventDefault();
              search(); // Explicit search on submit
            }}
          >
            <input
              type="text"
              className={`form-control ${styles.searchInput}`}
              placeholder="Name"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                debouncedSearch();
              }}
            />
            <select 
              className={`form-select ${styles.searchSelect}`} 
              value={category} 
              onChange={e => {
                setCategory(e.target.value);
                debouncedSearch();
              }}
            >
              <option value="">All Categories</option>
              {/* TODO: fetch categories */}
            </select>
            <Button className={styles.searchBtn} onClick={openNew}>
              Add
            </Button>
          </form>
        </div>

        {hasSearched && (
          <div className={styles.resultsSection}>
            {results.length === 0 ? (
              <div className={styles.noResults}>No results</div>
            ) : (
              <ul className="list-group">
                {results.map(item => (
                  <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{item.name}</span>
                    <div>
                      <Button variant="link" onClick={() => { setSelectedItem(item); setModalOpen(true); }}>
                        View
                      </Button>
                      {isAuthenticated && (
                        <Button variant="link" onClick={() => openEdit(item)}>Edit</Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {/* <Button onClick={openNew} variant="success" className={styles.newItemBtn}>New Item</Button> */}
          </div>
        )}

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

        {/* Only render ItemForm when it's open */}
        {formOpen && (
          <ItemForm
            show={formOpen}
            initialData={formData}
            onClose={() => setFormOpen(false)}
            onSave={handleSave}
          />
        )}

        {/* Login Modal */}
        <LoginModal 
          open={loginPromptOpen}
          onClose={() => setLoginPromptOpen(false)}
          onSuccess={() => {
            // If user was trying to add a new item
            if (!formData) {
              setFormOpen(true);
            } 
            // If user was trying to edit an existing item
            else {
              setFormData(formData);
              setFormOpen(true);
            }
          }}
        />
      </div>
    </>
  );
};

export default SearchPage;
