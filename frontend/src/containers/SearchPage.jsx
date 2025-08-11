import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import ItemForm from './ItemForm';
import Navbar from '../components/Navbar';
import styles from './SearchPage.module.css';

import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { cancellableGet, debounce } from '../utils/apiUtils';
import { api } from '../utils/authUtils';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState([]);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const searchTimeoutRef = useRef(null);
  
  
  // Navigation and auth
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  
  // Cleanup function to cancel pending requests on unmount
  useEffect(() => {
    // Return a cleanup function that uses the current value of the ref
    return () => {
      // This will be called when component unmounts
      const timeoutId = searchTimeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Load categories for the filter dropdown
  useEffect(() => {
    const load = async () => {
      try {
        const res = await cancellableGet('/categories', 'searchPageCategories');
        setCategoriesList(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        // Ignore, dropdown will stay with default option
        setCategoriesList([]);
      }
    };
    load();
    // No cleanup needed; cancellableGet handles prior-request cancellation by ID
  }, []);

  // Debounced search function to prevent multiple API calls
  const search = useCallback(async () => {
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      if (category) params.set('category_id', category);
      const qs = params.toString();
      const res = await cancellableGet(
        `/items${qs ? `?${qs}` : ''}`,
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
    if (isAuthenticated()) {
      setFormData(null); 
      setFormOpen(true); 
    } else {
      // Redirect to login page with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
    }
  };
  
  const openEdit = item => { 
    if (isAuthenticated()) {
      setFormData(item); 
      setFormOpen(true); 
    } else {
      // Redirect to login page with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
    }
  };

  // After save, refresh results. If it was a creation, auto-open edit with returned item
  const handleSave = (savedItem) => { 
    const wasCreate = !formData?.id && savedItem?.id;
    setFormOpen(false);
    // Refresh list
    search(); 
    if (wasCreate) {
      // Immediately open edit dialog with the newly created item
      setTimeout(() => {
        setFormData(savedItem);
        setFormOpen(true);
      }, 0);
    }
  };

  // Note: camera capture lives in the edit dialog's photo upload section now.
            
  return (
    <>
      <Navbar />
      <div className={styles.searchPageBg}>
        <div className={styles.searchCard}>
          <div className={styles.searchTitle}>Search or add an item</div>
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
              placeholder="Search by item name"
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
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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
                      <Button variant="link" onClick={() => { setSelectedItem(item); setFormOpen(true); }}>
                        View
                      </Button>
                      {isAuthenticated() && (
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

  {/* Use ItemForm to view/edit selected item */}

        {/* Only render ItemForm when it's open */}
        {formOpen && (
          <ItemForm
            show={formOpen}
            initialData={formData}
            onClose={() => setFormOpen(false)}
            onSave={handleSave}
          />
        )}
      </div>
    </>
  );
};

export default SearchPage;
