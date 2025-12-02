import { useEffect, useState } from 'react';
import axios from 'axios'; // Keep for axios.isCancel
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import ConfirmationDialog from '../components/ConfirmationDialog';
import PhotoUpload from '../components/PhotoUpload';
import { useNavigate } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import { api } from '../utils/authUtils';
import { getApiBaseUrl } from '../utils/urlUtils';

// Main ItemForm component
const ItemForm = ({ show, onClose, onSave, initialData = null, autoUploadPhotoFile = null, onAutoUploadConsumed = null }) => {
  const [categories, setCategories] = useState([]);
  const [specFields, setSpecFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(initialData?.primary_photo_url || null);
  const [authInProgress, setAuthInProgress] = useState(false);
  // Disambiguation state
  const [showDisambiguationDialog, setShowDisambiguationDialog] = useState(false);
  const [disambiguatedName, setDisambiguatedName] = useState('');

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

            // Construct the full URL using the API base URL
            const apiBaseUrl = getApiBaseUrl();
            setPhotoPreviewUrl(itemData.primary_photo ? `${apiBaseUrl}/uploads/${itemData.primary_photo}` : initialData.primary_photo_url);
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
      console.log('Photo URL updated:', url);
      setPhotoPreviewUrl(url);
    }
  };

  // Check if an item name already exists in the same category
  const checkDuplicateName = async (name, categoryId, currentItemId = null) => {
    try {
      // Search for items with the same name in the same category
      const searchParams = new URLSearchParams({
        search: name,
        category_id: categoryId
      });

      const res = await api.get(`/items?${searchParams.toString()}`);

      // Filter out the current item (if editing)
      const duplicates = currentItemId
        ? res.data.filter(item => item.id !== parseInt(currentItemId) && item.name.toLowerCase() === name.toLowerCase())
        : res.data.filter(item => item.name.toLowerCase() === name.toLowerCase());

      console.log('Checking duplicates:', duplicates);
      return duplicates.length > 0;
    } catch (error) {
      console.error('Error checking for duplicate names:', error);
      return false; // Assume no duplicates if the check fails
    }
  };

  // Generate a disambiguated name by adding a numeric suffix
  const generateDisambiguatedName = (baseName) => {
    // Extract any existing numeric suffix
    const match = baseName.match(/^(.+?)(?:\s*\((\d+)\))?$/);
    if (!match) return `${baseName} (1)`;

    const [, nameWithoutSuffix, existingSuffix] = match;
    const newSuffix = existingSuffix ? parseInt(existingSuffix) + 1 : 1;

    return `${nameWithoutSuffix.trim()} (${newSuffix})`;
  };

  // Handle save with disambiguation
  const saveWithDisambiguation = async (useDisambiguatedName = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use either the disambiguated name or the original name
      const finalName = useDisambiguatedName ? disambiguatedName : form.name;
      console.log('Saving item with name:', finalName);

      // Prepare payload with properly formatted data
      const payload = {
        name: finalName,
        category_id: form.category_id,
        specification_values: form.specs || {}
      };

      console.log('Payload:', payload);

      // Set the appropriate content type for JSON data
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };

      let response;

      if (initialData && initialData.id) {
        console.log(`Updating item ${initialData.id}`);
        response = await api.put(`/items/${initialData.id}`, JSON.stringify(payload), config);
      } else {
        console.log('Creating new item');
        response = await api.post('/items', JSON.stringify(payload), config);
      }

      console.log('API response:', response);
      setIsLoading(false);

      // Close the dialog and call onSave with the response data
      setShowDisambiguationDialog(false);

      if (initialData && initialData.id) {
        onSave(response?.data || initialData);
      } else {
        onSave(response?.data);
      }
    } catch (error) {
      console.error('Error submitting item:', error);
      setIsLoading(false);
      setError(error.response?.data?.error || 'An error occurred while saving the item. Please try again.');
      // Keep the dialog open if there's an error during saving with a disambiguated name
      if (!useDisambiguatedName) {
        setShowDisambiguationDialog(false);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e, skipAuthCheck = false) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    console.log('Form submission initiated');

    // Check authentication status before proceeding
    if (!skipAuthCheck && !isAuthenticated && !authInProgress) {
      setAuthInProgress(true);
      console.log('User not authenticated, redirecting to login');
      // Get the current location to redirect back after login
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // Reset auth progress state
    setAuthInProgress(false);

    // Don't proceed if category or name is empty
    if (!form.category_id || !form.name) {
      console.log('Missing required fields', form);
      setError('Name and category are required.');
      return;
    }

    console.log('Checking for duplicate name:', form.name, 'in category:', form.category_id);

    // Check for duplicate name before submitting
    const isDuplicate = await checkDuplicateName(
      form.name,
      form.category_id,
      initialData?.id
    );

    console.log('Duplicate check result:', isDuplicate);

    if (isDuplicate) {
      // Generate a suggested disambiguated name
      const newName = generateDisambiguatedName(form.name);
      console.log('Duplicate found, suggesting new name:', newName);
      setDisambiguatedName(newName);
      setShowDisambiguationDialog(true);
      return;
    }

    console.log('No duplicate found, proceeding with normal save');
    // If no duplicate, proceed with normal save
    await saveWithDisambiguation(false);
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
            // Construct the full URL using the API base URL
            const apiBaseUrl = getApiBaseUrl();
            setPhotoPreviewUrl(`${apiBaseUrl}/uploads/${filename}`);
            console.log(`Auto-uploaded photo URL: ${apiBaseUrl}/uploads/${filename}`);
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
    <>
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

      {/* Disambiguation dialog */}
      <ConfirmationDialog
        show={showDisambiguationDialog}
        title="Duplicate Item Name"
        message={
          <div>
            <p>An item with the name <strong>{form.name}</strong> already exists in this category.</p>
            <p>Would you like to save this item with a suggested unique name instead?</p>
            <Input
              name="disambiguatedName"
              value={disambiguatedName}
              onChange={(e) => setDisambiguatedName(e.target.value)}
              label="Suggested name"
              className="mt-3"
            />
          </div>
        }
        confirmLabel="Use Suggested Name"
        cancelLabel="Use Original Name"
        onConfirm={() => saveWithDisambiguation(true)}
        onCancel={() => saveWithDisambiguation(false)}
        onClose={() => setShowDisambiguationDialog(false)}
      />
    </>
  );
};

export default ItemForm;
