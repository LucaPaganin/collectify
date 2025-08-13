import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/authUtils'; // Import the configured api
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';

// Import custom components
import Navbar from '../components/Navbar';
import styles from './AdminPage.module.css';
import CategoryForm from '../components/admin/CategoryForm';
import EditCategoryModal from '../components/admin/EditCategoryModal';
import DeleteCategoryModal from '../components/admin/DeleteCategoryModal';
import SpecificationsModal from '../components/admin/SpecificationsModal';

// Material UI imports
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Snackbar,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem
} from '@mui/material';

import {
  Close as CloseIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const AdminPage = () => {
  const navigate = useNavigate();
  const auth = useAuthUser();
  const signOut = useSignOut();
  
  // State management
  const [state, setState] = useState({
    categories: [],
    loading: true,
    snackbar: { open: false, message: '', severity: 'info' },
    modals: {
      editCategory: { open: false, data: null },
      deleteCategory: { open: false, id: null },
      specifications: { 
        open: false, 
        categoryId: null, 
        categoryName: '',
        specifications: []
      }
    }
  });

  // Drag and drop state for specification reordering
  const [draggedSpecIndex, setDraggedSpecIndex] = useState(null);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const response = await api.get('/categories');
      setState(prev => ({ 
        ...prev, 
        categories: response.data,
        loading: false
      }));
    } catch (error) {
      showSnackbar('Error fetching categories: ' + (error.response?.data?.error || error.message), 'error');
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch specifications schema for a category
  const fetchSpecificationsSchema = async (categoryId, categoryName) => {
    try {
      const response = await api.get(`/categories/${categoryId}/specifications_schema`);
      
      // Process the response data based on its structure
      let specs;
      if (Array.isArray(response.data)) {
        // It's already an array, just sort it
        specs = response.data.sort((a, b) => 
          (a.display_order || 0) - (b.display_order || 0)
        );
      } else if (typeof response.data === 'object') {
        // It's an object, convert to array
        specs = Object.entries(response.data).map(([key, spec], index) => ({
          key,
          ...spec,
          display_order: spec.display_order || index
        }));
        // Sort by display_order
        specs.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      } else {
        // Unexpected format
        specs = [];
        console.error('Unexpected format for specifications schema:', response.data);
      }
      
      setState(prev => ({
        ...prev,
        modals: {
          ...prev.modals,
          specifications: {
            ...prev.modals.specifications,
            specifications: specs
          }
        }
      }));
    } catch (error) {
      console.error('Error fetching specifications:', error);
      setState(prev => ({
        ...prev,
        modals: {
          ...prev.modals,
          specifications: {
            ...prev.modals.specifications,
            specifications: []
          }
        }
      }));
      showSnackbar('Error fetching specifications: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Add a new category
  const addCategory = async (categoryName) => {
    try {
      const response = await api.post('/categories', { name: categoryName });
      setState(prev => ({
        ...prev,
        categories: [...prev.categories, response.data].sort((a, b) => a.name.localeCompare(b.name))
      }));
      showSnackbar('Category added successfully', 'success');
    } catch (error) {
      showSnackbar('Error adding category: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Update a category name
  const updateCategory = async (updatedCategory) => {
    try {
      const response = await api.put(`/categories/${updatedCategory.id}`, { name: updatedCategory.name });
      setState(prev => ({
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === updatedCategory.id ? { ...cat, name: response.data.name } : cat
        ),
        modals: {
          ...prev.modals,
          editCategory: {
            open: false,
            data: null
          }
        }
      }));
      showSnackbar('Category updated successfully', 'success');
    } catch (error) {
      showSnackbar('Error updating category: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Delete a category
  const deleteCategory = async () => {
    const categoryId = state.modals.deleteCategory.id;
    
    try {
      await api.delete(`/categories/${categoryId}`);
      setState(prev => ({
        ...prev,
        categories: prev.categories.filter(cat => cat.id !== categoryId),
        modals: {
          ...prev.modals,
          deleteCategory: {
            open: false,
            id: null
          }
        }
      }));
      showSnackbar('Category deleted successfully', 'success');
    } catch (error) {
      showSnackbar('Error deleting category: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Open specifications modal for a category
  const openSpecsModalForCategory = (categoryId, categoryName) => {
    setState(prev => ({
      ...prev,
      modals: {
        ...prev.modals,
        specifications: {
          open: true,
          categoryId,
          categoryName,
          specifications: []
        }
      }
    }));
    fetchSpecificationsSchema(categoryId, categoryName);
  };

  // Add a new specification field
  const addSpecificationField = () => {
    const newSpec = {
      key: '',
      label: '',
      type: 'text',
      placeholder: '',
      display_order: 0 // Add new fields at the top
    };
    
    setState(prev => {
      const currentSpecs = prev.modals.specifications.specifications;
      return {
        ...prev,
        modals: {
          ...prev.modals,
          specifications: {
            ...prev.modals.specifications,
            specifications: [newSpec, ...currentSpecs.map(spec => ({
              ...spec,
              display_order: (spec.display_order || 0) + 1
            }))]
          }
        }
      };
    });
  };

  // Update a specification field
  const updateSpecificationField = (index, field, value) => {
    setState(prev => {
      const updatedSpecs = [...prev.modals.specifications.specifications];
      
      // If we're updating a specific field
      if (typeof index === 'number') {
        updatedSpecs[index] = { ...updatedSpecs[index], [field]: value };
        
        // If changing type, reset type-specific fields
        if (field === 'type') {
          if (value === 'number') {
            updatedSpecs[index] = { 
              ...updatedSpecs[index], 
              min: undefined, 
              max: undefined, 
              step: 1,
              options: undefined
            };
          } else if (value === 'select') {
            updatedSpecs[index] = { 
              ...updatedSpecs[index], 
              options: [],
              min: undefined, 
              max: undefined, 
              step: undefined
            };
          } else {
            updatedSpecs[index] = { 
              ...updatedSpecs[index], 
              min: undefined, 
              max: undefined, 
              step: undefined,
              options: undefined
            };
          }
        }
      } 
      // If we're replacing the entire specifications array (for reordering)
      else if (Array.isArray(index)) {
        return {
          ...prev,
          modals: {
            ...prev.modals,
            specifications: {
              ...prev.modals.specifications,
              specifications: index
            }
          }
        };
      }
      
      return {
        ...prev,
        modals: {
          ...prev.modals,
          specifications: {
            ...prev.modals.specifications,
            specifications: updatedSpecs
          }
        }
      };
    });
  };

  // Remove a specification field
  const removeSpecificationField = (index) => {
    setState(prev => {
      const updatedSpecs = [...prev.modals.specifications.specifications];
      updatedSpecs.splice(index, 1);
      
      // Update display_order for remaining items
      const reorderedSpecs = updatedSpecs.map((spec, idx) => ({ 
        ...spec, 
        display_order: idx 
      }));
      
      return {
        ...prev,
        modals: {
          ...prev.modals,
          specifications: {
            ...prev.modals.specifications,
            specifications: reorderedSpecs
          }
        }
      };
    });
  };

  // Save specifications schema
  const saveSpecificationsSchema = async () => {
    const { categoryId, specifications } = state.modals.specifications;
    
    // Validate required fields
    const hasEmptyKeys = specifications.some(spec => !spec.key || !spec.key.trim());
    if (hasEmptyKeys) {
      showSnackbar('All specification fields must have a key', 'error');
      return;
    }

    try {
      // Make sure all spec objects have the required properties and correct format
      const formattedSpecs = specifications.map((spec, index) => ({
        key: spec.key,
        label: spec.label || spec.key,
        type: spec.type || 'text',
        placeholder: spec.placeholder || '',
        display_order: spec.display_order !== undefined ? spec.display_order : index,
        ...(spec.type === 'number' ? {
          min: spec.min !== undefined ? Number(spec.min) : undefined,
          max: spec.max !== undefined ? Number(spec.max) : undefined,
          step: spec.step !== undefined ? Number(spec.step) : 1
        } : {}),
        ...(spec.type === 'select' ? {
          options: Array.isArray(spec.options) ? spec.options : []
        } : {})
      }));

      // Send properly formatted specifications
      await api.put(
        `/categories/${categoryId}/specifications_schema`, 
        formattedSpecs,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      showSnackbar('Specifications saved successfully', 'success');
      closeSpecificationsModal();
    } catch (error) {
      console.error('Error saving specifications:', error);
      showSnackbar('Error saving specifications: ' + (error.response?.data?.error || error.message), 'error');
    }
  };
  
  // These functions are kept as comments for future reference if needed
  /*
  // Handle changes to a specification field option
  const handleSpecOptionChange = (specIndex, optionIndex, value) => {
    setState(prev => {
      const updatedSpecs = [...prev.modals.specifications.specifications];
      
      // Make sure options array exists
      if (!updatedSpecs[specIndex].options) {
        updatedSpecs[specIndex].options = [];
      }
      
      // Update the specific option
      updatedSpecs[specIndex].options[optionIndex] = value;
      
      return {
        ...prev,
        modals: {
          ...prev.modals,
          specifications: {
            ...prev.modals.specifications,
            specifications: updatedSpecs
          }
        }
      };
    });
  };

  // Add a new option to a select specification
  const addSpecOption = (specIndex) => {
    setState(prev => {
      const updatedSpecs = [...prev.modals.specifications.specifications];
      
      // Make sure options array exists
      if (!updatedSpecs[specIndex].options) {
        updatedSpecs[specIndex].options = [];
      }
      
      // Add a new empty option
      updatedSpecs[specIndex].options.push('');
      
      return {
        ...prev,
        modals: {
          ...prev.modals,
          specifications: {
            ...prev.modals.specifications,
            specifications: updatedSpecs
          }
        }
      };
    });
  };

  // Remove an option from a select specification
  const removeSpecOption = (specIndex, optionIndex) => {
    setState(prev => {
      const updatedSpecs = [...prev.modals.specifications.specifications];
      
      // Remove the option if options array exists
      if (updatedSpecs[specIndex].options) {
        updatedSpecs[specIndex].options.splice(optionIndex, 1);
      }
      
      return {
        ...prev,
        modals: {
          ...prev.modals,
          specifications: {
            ...prev.modals.specifications,
            specifications: updatedSpecs
          }
        }
      };
    });
  };
  */

  // Handle logout
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'info') => {
    setState(prev => ({
      ...prev,
      snackbar: { open: true, message, severity }
    }));
  };

  // Close snackbar
  const closeSnackbar = () => {
    setState(prev => ({
      ...prev,
      snackbar: { ...prev.snackbar, open: false }
    }));
  };

  // Modal handling functions
  const openEditCategoryModal = (category) => {
    setState(prev => ({
      ...prev,
      modals: {
        ...prev.modals,
        editCategory: { open: true, data: category }
      }
    }));
  };

  const closeEditCategoryModal = () => {
    setState(prev => ({
      ...prev,
      modals: {
        ...prev.modals,
        editCategory: { open: false, data: null }
      }
    }));
  };

  const openDeleteCategoryModal = (categoryId) => {
    setState(prev => ({
      ...prev,
      modals: {
        ...prev.modals,
        deleteCategory: { open: true, id: categoryId }
      }
    }));
  };

  const closeDeleteCategoryModal = () => {
    setState(prev => ({
      ...prev,
      modals: {
        ...prev.modals,
        deleteCategory: { open: false, id: null }
      }
    }));
  };

  const closeSpecificationsModal = () => {
    setState(prev => ({
      ...prev,
      modals: {
        ...prev.modals,
        specifications: {
          open: false,
          categoryId: null,
          categoryName: '',
          specifications: []
        }
      }
    }));
  };

  // Drag and drop handlers for specifications reordering
  const handleDragStart = (e, index) => {
    setDraggedSpecIndex(index);
    // For better drag and drop visual feedback
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    // Nothing else needed here
  };

  const handleDragEnd = () => {
    setDraggedSpecIndex(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropTarget = e.currentTarget;
    const dropIndex = parseInt(dropTarget.dataset.index || 0, 10);
    
    if (draggedSpecIndex === null || draggedSpecIndex === dropIndex) {
      return;
    }

    setState(prev => {
      const specs = [...prev.modals.specifications.specifications];
      const draggedItem = specs[draggedSpecIndex];
      
      // Remove the dragged item
      specs.splice(draggedSpecIndex, 1);
      // Insert it at the new position
      specs.splice(dropIndex, 0, draggedItem);
      
      // Update display order for all items
      const reorderedSpecs = specs.map((spec, idx) => ({
        ...spec,
        display_order: idx
      }));
      
      return {
        ...prev,
        modals: {
          ...prev.modals,
          specifications: {
            ...prev.modals.specifications,
            specifications: reorderedSpecs
          }
        }
      };
    });
    
    setDraggedSpecIndex(null);
  };

  if (state.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="admin-page">
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box className={styles.adminHeader}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="500">
              Admin Panel
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Logged in as {auth?.user}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
            <Button 
              variant="outlined" 
              color="inherit" 
              onClick={() => navigate('/')}
              startIcon={<CloseIcon />}
            >
              Back to Gallery
            </Button>
          </Box>
        </Box>

        <Card className={styles.card} elevation={2}>
          <CardContent className={styles.cardBody}>
            <Typography variant="h6" component="h2" gutterBottom>
              Manage Categories
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add, edit or remove item categories. A category cannot be deleted if it is being used by any items.
            </Typography>

            <List sx={{ mb: 3 }}>
              {state.categories.length === 0 ? (
                <ListItem>
                  <Typography variant="body2" color="text.secondary">
                    No categories found.
                  </Typography>
                </ListItem>
              ) : (
                state.categories.map(category => (
                  <ListItem
                    key={category.id}
                    secondaryAction={
                      <Box className={styles.actionButtons}>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => openEditCategoryModal({ id: category.id, name: category.name })}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="specifications"
                          onClick={() => openSpecsModalForCategory(category.id, category.name)}
                        >
                          <SettingsIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => openDeleteCategoryModal(category.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                  >
                    <Typography variant="body1">{category.name}</Typography>
                  </ListItem>
                ))
              )}
            </List>
            
            <CategoryForm onSubmit={addCategory} />
          </CardContent>
        </Card>
      </Container>

      {/* Edit Category Modal */}
      <EditCategoryModal 
        open={state.modals.editCategory.open} 
        category={state.modals.editCategory.data || {}}
        onClose={closeEditCategoryModal}
        onSave={updateCategory}
      />

      {/* Delete Category Modal */}
      <DeleteCategoryModal 
        open={state.modals.deleteCategory.open}
        onClose={closeDeleteCategoryModal}
        onDelete={deleteCategory}
      />

      {/* Specifications Modal */}
      <SpecificationsModal 
        open={state.modals.specifications.open}
        categoryName={state.modals.specifications.categoryName}
        specifications={state.modals.specifications.specifications}
        onClose={closeSpecificationsModal}
  onAddSpecification={addSpecificationField}
  onUpdateSpecification={updateSpecificationField}
  onRemoveSpecification={removeSpecificationField}
        onSave={saveSpecificationsSchema}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={state.snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={state.snackbar.severity} sx={{ width: '100%' }}>
          {state.snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AdminPage;
