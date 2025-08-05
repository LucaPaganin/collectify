
// Removed duplicate imports
import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CollectionsIcon from '@mui/icons-material/Collections';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import SettingsIcon from '@mui/icons-material/Settings';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ onNewItem }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';
  
  return (
    <AppBar position="sticky" color="primary" elevation={2}>
      <Toolbar>
        <Tooltip title="Manage Categories">
          <IconButton color="inherit" onClick={() => navigate('/admin')} edge="start" sx={{ mr: 1 }}>
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <CollectionsIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Collectify
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {!isAdminPage && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SettingsIcon />}
            onClick={() => navigate('/admin')}
            sx={{ fontWeight: 500, background: '#fff', color: '#0d6efd', boxShadow: 'none', '&:hover': { background: '#e3eaff' } }}
          >
            Admin Panel
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
