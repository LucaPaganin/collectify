import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import ItemForm from './ItemForm';
import Navbar from '../components/Navbar';
import styles from './SearchPage.module.css';

import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { api } from '../utils/authUtils';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState([]);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const searchTimeoutRef = useRef(null);
  
  
  // Navigation and auth
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  
  // Cleanup function for any pending operations
  useEffect(() => {
    // Store ref value in a variable to use in cleanup
    const currentTimeoutRef = searchTimeoutRef.current;
    
    return () => {
      // Clear any pending search timeouts using the captured value
      if (currentTimeoutRef) {
        clearTimeout(currentTimeoutRef);
      }
    };
  }, []);

  // Debounced search function to prevent multiple API calls
  const search = useCallback(async () => {
    setHasSearched(true);
    
    try {
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      if (category) params.set('category_id', category);
      const qs = params.toString();
      const url = `/api/items${qs ? `?${qs}` : ''}`;
      
      console.log(`Searching with URL: ${url}`);
      const res = await api.get(url);
      console.log('Search results:', res.data);
      setResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Search error:', err);
      // Error is already logged in the utility
      setResults([]);
    }
  }, [query, category]);

  // Load categories for the filter dropdown
  useEffect(() => {
    const load = async () => {
      try {
        console.log('Loading categories...');
        const res = await api.get('/api/categories');
        console.log('Categories response:', res);
        setCategoriesList(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Error loading categories:', e);
        // Ignore, dropdown will stay with default option
        setCategoriesList([]);
      }
    };
    load();
    
    // Load initial search results if URL has search params
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('search');
    const urlCategory = urlParams.get('category_id');
    
    if (urlQuery || urlCategory) {
      setQuery(urlQuery || '');
      setCategory(urlCategory || '');
      setTimeout(() => search(), 100);
    }
    
    // Axios will automatically handle request cleanup
  }, [search]);

  // Create a debounced version of the search function
  const debouncedSearch = useCallback(
    () => {
      const handler = setTimeout(() => {
        search();
      }, 500);
      
      // Store the timeout ID so it can be cleared if needed
      searchTimeoutRef.current = handler;
      
      return () => {
        clearTimeout(handler);
      };
    },
    [search]
  );

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
      // Add primary_photo_url to item data when editing using the primary_photo filename
      const itemWithPhotoUrl = {
        ...item,
        primary_photo_url: item.primary_photo ? `/uploads/${item.primary_photo}` : null
      };
      setFormData(itemWithPhotoUrl); 
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
        // Add primary_photo_url when opening for edit
        const itemWithPhotoUrl = {
          ...savedItem,
          primary_photo_url: savedItem.primary_photo ? `/uploads/${savedItem.primary_photo}` : null
        };
        setFormData(itemWithPhotoUrl);
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
                // Call our debounced search function
                debouncedSearch();
              }}
            />
            <select 
              className={`form-select ${styles.searchSelect}`} 
              value={category} 
              onChange={e => {
                setCategory(e.target.value);
                // Call our debounced search function
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
