import React, { useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button, 
  Typography 
} from '@mui/material';
import { Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';
import SpecificationField from './SpecificationField';
import styles from '../../containers/AdminPage.module.css';

const SpecificationsModal = ({ 
  open, 
  categoryName, 
  specifications, 
  onClose, 
  onAddSpecification, 
  onUpdateSpecification, 
  onRemoveSpecification, 
  onSave 
}) => {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

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
    
    // Update parent component state
    onUpdateSpecificationsOrder(reorderedSpecs);
    
    e.target.classList.remove(styles.dragging);
  };

  // Update specifications order in parent component
  const onUpdateSpecificationsOrder = (reorderedSpecs) => {
    // Replace entire specifications array with reordered one
    onUpdateSpecification(reorderedSpecs);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Edit Specifications for {categoryName}
      </DialogTitle>
      <DialogContent>
        <DialogContentText paragraph>
          Define specifications for this category. These specifications will be used as a template for all items in this category.
        </DialogContentText>
        
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />} 
          onClick={onAddSpecification}
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
            <SpecificationField
              key={index}
              spec={spec}
              index={index}
              onUpdate={onUpdateSpecification}
              onRemove={onRemoveSpecification}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
            />
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained" startIcon={<SaveIcon />}>
          Save Specifications
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SpecificationsModal;
