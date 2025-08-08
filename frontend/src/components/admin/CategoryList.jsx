import React from 'react';
import { List, ListItem, Typography } from '@mui/material';
import CategoryListItem from './CategoryListItem';

const CategoryList = ({ categories, onEdit, onOpenSpecsModal, onDelete }) => {
  if (categories.length === 0) {
    return (
      <List sx={{ mb: 3 }}>
        <ListItem>
          <Typography variant="body2" color="text.secondary">
            No categories found.
          </Typography>
        </ListItem>
      </List>
    );
  }

  return (
    <List sx={{ mb: 3 }}>
      {categories.map(category => (
        <CategoryListItem 
          key={category.id}
          category={category}
          onEdit={onEdit}
          onOpenSpecsModal={onOpenSpecsModal}
          onDelete={onDelete}
        />
      ))}
    </List>
  );
};

export default CategoryList;
