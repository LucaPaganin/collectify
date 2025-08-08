import React from 'react';
import { ListItem, Typography, Box, IconButton } from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import styles from '../../containers/AdminPage.module.css';

const CategoryListItem = ({ category, onEdit, onOpenSpecsModal, onDelete }) => {
  return (
    <ListItem
      key={category.id}
      secondaryAction={
        <Box className={styles.actionButtons}>
          <IconButton 
            edge="end" 
            aria-label="edit"
            onClick={() => onEdit(category)}
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            edge="end" 
            aria-label="specifications"
            onClick={() => onOpenSpecsModal(category.id, category.name)}
          >
            <SettingsIcon />
          </IconButton>
          <IconButton 
            edge="end" 
            aria-label="delete"
            onClick={() => onDelete(category.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      }
    >
      <Typography variant="body1">{category.name}</Typography>
    </ListItem>
  );
};

export default CategoryListItem;
