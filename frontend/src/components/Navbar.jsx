
// Removed duplicate imports
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CollectionsIcon from '@mui/icons-material/Collections';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import SettingsIcon from '@mui/icons-material/Settings';
import Tooltip from '@mui/material/Tooltip';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate, useLocation } from 'react-router-dom';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import useSignOut from 'react-auth-kit/hooks/useSignOut';


const Navbar = ({ onNewItem }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';
  const isAuthenticated = useIsAuthenticated();
  const signOut = useSignOut();
  
  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };
  
  return (
    <AppBar position="sticky" color="primary" elevation={2}>
      <Toolbar>
        {isAuthenticated() && (
          <Tooltip title="Manage Categories">
            <IconButton color="inherit" onClick={() => navigate('/admin')} edge="start" sx={{ mr: 1 }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        )}
        <CollectionsIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          Collectify
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {!isAdminPage && isAuthenticated() && (
          <>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/admin')}
              sx={{ fontWeight: 500, background: '#fff', color: '#0d6efd', boxShadow: 'none', '&:hover': { background: '#e3eaff' }, mr: 2 }}
            >
              Admin Panel
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ fontWeight: 500, borderColor: '#fff', color: '#fff' }}
            >
              Logout
            </Button>
          </>
        )}
        {!isAuthenticated() && (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LoginIcon />}
            onClick={handleLoginClick}
            sx={{ fontWeight: 500, borderColor: '#fff', color: '#fff' }}
          >
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
