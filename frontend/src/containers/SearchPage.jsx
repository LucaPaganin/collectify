import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemForm from './ItemForm';
import Navbar from '../components/Navbar';
import SearchPanel from '../components/search/SearchPanel';
import AddItemPanel from '../components/search/AddItemPanel';
import SearchResults from '../components/search/SearchResults';
import styles from './SearchPage.module.css';
import { getApiBaseUrl } from '../utils/urlUtils';

import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { api } from '../utils/authUtils';

// Modal wrapper for ItemForm
const ItemFormModal = ({ formOpen, formData, setFormOpen, handleSave }) => {
  return (
    <ItemForm
      show={formOpen}
      onClose={() => setFormOpen(false)}
      onSave={handleSave}
      initialData={formData}
    />
  );
};

const SearchPage = () => {
  // Search form state
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categoriesList, setCategoriesList] = useState([]);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Add form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  // Form dialog state
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
      const url = `/items${qs ? `?${qs}` : ''}`;

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
        const res = await api.get('/categories');
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

  const openNew = (e) => {
    e.preventDefault();

    if (isAuthenticated()) {
      // Create initial data from the add form fields if provided
      const initialData = newItemName ? {
        name: newItemName,
        category_id: newItemCategory || '',
        specification_values: {}
      } : null;

      setFormData(initialData);
      setFormOpen(true);

      // Reset the add form fields after opening the modal
      setNewItemName('');
      setNewItemCategory('');
    } else {
      // Redirect to login page with return URL
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
    }
  };

  const openEdit = async (item) => {
    if (isAuthenticated()) {
      try {
        // Get the full item details from the API
        const response = await api.get(`/items/${item.id}`);
        const fullItemData = response.data;

        // Add primary_photo_url to item data when editing using the primary_photo filename
        // Construct the full URL using the API base URL
        const apiBaseUrl = getApiBaseUrl();
        const itemWithPhotoUrl = {
          ...fullItemData,
          primary_photo_url: fullItemData.primary_photo ? `${apiBaseUrl}/uploads/${fullItemData.primary_photo}` : null
        };

        setFormData(itemWithPhotoUrl);
        setFormOpen(true);
      } catch (error) {
        console.error('Error fetching item details:', error);
        // Fallback to basic data if API call fails
        const apiBaseUrl = getApiBaseUrl();
        const itemWithPhotoUrl = {
          ...item,
          primary_photo_url: item.primary_photo ? `${apiBaseUrl}/uploads/${item.primary_photo}` : null
        };
        setFormData(itemWithPhotoUrl);
        setFormOpen(true);
      }
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
        const apiBaseUrl = getApiBaseUrl();
        const itemWithPhotoUrl = {
          ...savedItem,
          primary_photo_url: savedItem.primary_photo ? `${apiBaseUrl}/uploads/${savedItem.primary_photo}` : null
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
        {/* Search panel as a separate component */}
        <SearchPanel
          query={query}
          setQuery={setQuery}
          category={category}
          setCategory={setCategory}
          categoriesList={categoriesList}
          debouncedSearch={debouncedSearch}
          search={search}
        />

        {/* Add item panel as a separate component */}
        <AddItemPanel
          newItemName={newItemName}
          setNewItemName={setNewItemName}
          newItemCategory={newItemCategory}
          setNewItemCategory={setNewItemCategory}
          categoriesList={categoriesList}
          openNew={openNew}
        />

        {hasSearched && (
          <SearchResults
            results={results}
            isAuthenticated={isAuthenticated}
            openEdit={openEdit}
          />
        )}

        {/* Use ItemForm to view/edit selected item */}

        {/* Use the ItemFormModal component */}
        <ItemFormModal
          formOpen={formOpen}
          formData={formData}
          setFormOpen={setFormOpen}
          handleSave={handleSave}
        />
      </div>
    </>
  );
};

export default SearchPage;
