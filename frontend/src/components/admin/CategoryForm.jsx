import React, { useState } from 'react';
import { TextField, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import styles from '../../containers/AdminPage.module.css';

const CategoryForm = ({ onAddCategory }) => {
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    onAddCategory(newCategoryName);
    setNewCategoryName('');
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
