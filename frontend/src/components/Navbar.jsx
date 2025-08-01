import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CollectionsIcon from '@mui/icons-material/Collections';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

const Navbar = ({ onNewItem }) => (
  <AppBar position="sticky" color="primary" elevation={2}>
    <Toolbar>
      <CollectionsIcon sx={{ mr: 1 }} />
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
        Collectify
      </Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        color="secondary"
        startIcon={<AddCircleIcon />}
        onClick={onNewItem}
        sx={{ fontWeight: 500, background: '#fff', color: '#0d6efd', boxShadow: 'none', '&:hover': { background: '#e3eaff' } }}
      >
        New Item
      </Button>
    </Toolbar>
  </AppBar>
);

export default Navbar;
