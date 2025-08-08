import React, { useState } from 'react';
import { TextField, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import styles from '../../containers/AdminPage.module.css';

const CategoryForm = ({ onSubmit, onAddCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // For backwards compatibility, use whichever prop is available
  const submitHandler = onAddCategory || onSubmit;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    if (typeof submitHandler === 'function') {
      submitHandler(newCategoryName);
      setNewCategoryName('');
    } else {
      console.error('No valid handler provided to CategoryForm');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.categoryForm}>
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
  );
};

export default CategoryForm;
