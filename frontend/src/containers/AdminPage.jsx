import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import styles from './AdminPage.module.css';
import { useAuthUser, useSignOut } from 'react-auth-kit';

// Material UI imports
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';

import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  Logout as LogoutIcon,
  Save as SaveIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const AdminPage = () => {
  const navigate = useNavigate();
  const auth = useAuthUser();
  const signOut = useSignOut();
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [openSpecsModal, setOpenSpecsModal] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [currentCategoryName, setCurrentCategoryName] = useState('');
  const [specifications, setSpecifications] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState({ id: null, name: '' });
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      showSnackbar('Error fetching categories: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch specifications schema for a category
  const fetchSpecificationsSchema = async (categoryId) => {
    try {
      const response = await axios.get(`/api/categories/${categoryId}/specifications_schema`);
      
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
      
      setSpecifications(specs);
    } catch (error) {
      console.error('Error fetching specifications:', error);
      setSpecifications([]);
      showSnackbar('Error fetching specifications: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Add a new category
  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await axios.post('/api/categories', { name: newCategoryName });
      setCategories([...categories, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName('');
      showSnackbar('Category added successfully', 'success');
    } catch (error) {
      showSnackbar('Error adding category: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Update a category name
  const updateCategory = async () => {
    try {
      const response = await axios.put(`/api/categories/${editModalData.id}`, { name: editModalData.name });
      setCategories(categories.map(cat => cat.id === editModalData.id ? { ...cat, name: response.data.name } : cat));
      showSnackbar('Category updated successfully', 'success');
      setOpenEditModal(false);
    } catch (error) {
      showSnackbar('Error updating category: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Delete a category
  const deleteCategory = async () => {
    try {
      await axios.delete(`/api/categories/${deleteModalId}`);
      setCategories(categories.filter(cat => cat.id !== deleteModalId));
      showSnackbar('Category deleted successfully', 'success');
      setOpenDeleteModal(false);
    } catch (error) {
      showSnackbar('Error deleting category: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Handle drag start for specifications reordering
  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.target.classList.add(styles.dragging);
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.classList.remove(styles.dragging);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  // Handle drop to reorder specifications
  const handleDrop = (e) => {
    e.preventDefault();
    const copySpecs = [...specifications];
    const dragItemContent = copySpecs[dragItem.current];
    
    // Remove dragged item
    copySpecs.splice(dragItem.current, 1);
    
    // Add at new position
    copySpecs.splice(dragOverItem.current, 0, dragItemContent);
    
    // Update display order
    const reorderedSpecs = copySpecs.map((spec, index) => ({ ...spec, display_order: index }));
    
    setSpecifications(reorderedSpecs);
    e.target.classList.remove(styles.dragging);
  };

  // Open specifications modal for a category
  const openSpecsModalForCategory = (categoryId, categoryName) => {
    setCurrentCategoryId(categoryId);
    setCurrentCategoryName(categoryName);
    fetchSpecificationsSchema(categoryId);
    setOpenSpecsModal(true);
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
    setSpecifications([newSpec, ...specifications.map(spec => ({
      ...spec,
      display_order: (spec.display_order || 0) + 1
    }))]);
  };

  // Update a specification field
  const updateSpecificationField = (index, field, value) => {
    const updatedSpecs = [...specifications];
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
    
    setSpecifications(updatedSpecs);
  };

  // Remove a specification field
  const removeSpecificationField = (index) => {
    const updatedSpecs = [...specifications];
    updatedSpecs.splice(index, 1);
    // Update display_order for remaining items
    const reorderedSpecs = updatedSpecs.map((spec, idx) => ({ ...spec, display_order: idx }));
    setSpecifications(reorderedSpecs);
  };

  // Save specifications schema
  const saveSpecificationsSchema = async () => {
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
      await axios.put(
        `/api/categories/${currentCategoryId}/specifications_schema`, 
        formattedSpecs,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      showSnackbar('Specifications saved successfully', 'success');
      setOpenSpecsModal(false);
    } catch (error) {
      console.error('Error saving specifications:', error);
      showSnackbar('Error saving specifications: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  // Handle logout
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const closeSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
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
              {categories.length === 0 ? (
                <ListItem>
                  <Typography variant="body2" color="text.secondary">
                    No categories found.
                  </Typography>
                </ListItem>
              ) : (
                categories.map(category => (
                  <ListItem
                    key={category.id}
                    secondaryAction={
                      <Box className={styles.actionButtons}>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => {
                            setEditModalData({ id: category.id, name: category.name });
                            setOpenEditModal(true);
                          }}
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
                          onClick={() => {
                            setDeleteModalId(category.id);
                            setOpenDeleteModal(true);
                          }}
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
            
            <form onSubmit={addCategory} className={styles.categoryForm}>
              <TextField
                label="New category name"
                variant="outlined"
                size="small"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className={styles.formInput}
                required
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                startIcon={<AddIcon />}
              >
                Add Category
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>

      {/* Edit Category Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editModalData.name}
            onChange={(e) => setEditModalData({ ...editModalData, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
          <Button onClick={updateCategory} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Category Modal */}
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this category? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteModal(false)}>Cancel</Button>
          <Button onClick={deleteCategory} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Specifications Modal */}
      <Dialog 
        open={openSpecsModal} 
        onClose={() => setOpenSpecsModal(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Edit Specifications for {currentCategoryName}
        </DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Define specifications for this category. These specifications will be used as a template for all items in this category.
          </DialogContentText>
          
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={addSpecificationField}
            sx={{ mb: 3 }}
          >
            Add Specification Field
          </Button>
          
          {specifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No specifications defined yet. Click the button above to add one.
            </Typography>
          ) : (
            specifications.map((spec, index) => (
              <Paper 
                key={index} 
                className={styles.specField}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                sx={{ p: 2, mb: 2 }}
              >
                <Box className={styles.specFieldHeader}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DragIndicatorIcon className={styles.dragHandle} />
                    <Typography variant="subtitle1">Specification Field</Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => removeSpecificationField(index)}
                  >
                    Remove
                  </Button>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Field Key (code name)"
                      placeholder="e.g., weight, color, material"
                      fullWidth
                      value={spec.key || ''}
                      onChange={(e) => updateSpecificationField(index, 'key', e.target.value)}
                      required
                      helperText="Required. Used in code, no spaces."
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Field Label (display name)"
                      placeholder="e.g., Weight, Color, Material"
                      fullWidth
                      value={spec.label || ''}
                      onChange={(e) => updateSpecificationField(index, 'label', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Field Type</InputLabel>
                      <Select
                        value={spec.type || 'text'}
                        label="Field Type"
                        onChange={(e) => updateSpecificationField(index, 'type', e.target.value)}
                      >
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="number">Number</MenuItem>
                        <MenuItem value="select">Select (dropdown)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Placeholder"
                      placeholder="e.g., Enter weight in grams..."
                      fullWidth
                      value={spec.placeholder || ''}
                      onChange={(e) => updateSpecificationField(index, 'placeholder', e.target.value)}
                    />
                  </Grid>
                  
                  {/* Number type specific fields */}
                  {spec.type === 'number' && (
                    <>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Min Value"
                          type="number"
                          fullWidth
                          value={spec.min || ''}
                          onChange={(e) => updateSpecificationField(index, 'min', e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Max Value"
                          type="number"
                          fullWidth
                          value={spec.max || ''}
                          onChange={(e) => updateSpecificationField(index, 'max', e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Step"
                          type="number"
                          fullWidth
                          value={spec.step || 1}
                          onChange={(e) => updateSpecificationField(index, 'step', e.target.value ? Number(e.target.value) : 1)}
                          inputProps={{ min: 0.0001, step: 0.0001 }}
                        />
                      </Grid>
                    </>
                  )}
                  
                  {/* Select type specific fields */}
                  {spec.type === 'select' && (
                    <Grid item xs={12}>
                      <TextField
                        label="Options (one per line, format: value|label)"
                        multiline
                        rows={3}
                        fullWidth
                        value={spec.options ? spec.options.map(o => `${o.value}|${o.label}`).join('\n') : ''}
                        onChange={(e) => {
                          const options = e.target.value.split('\n')
                            .filter(line => line.trim())
                            .map(line => {
                              const parts = line.split('|');
                              const value = parts[0].trim();
                              const label = parts.length > 1 ? parts[1].trim() : value;
                              return { value, label };
                            });
                          updateSpecificationField(index, 'options', options);
                        }}
                        placeholder="red|Red Color"
                        helperText="Example: red|Red Color"
                      />
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSpecsModal(false)}>Cancel</Button>
          <Button onClick={saveSpecificationsSchema} variant="contained" startIcon={<SaveIcon />}>
            Save Specifications
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminPage;
