import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Typography,
  Alert,
  Box
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ open, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password, rememberMe);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form state when closing
    setUsername('');
    setPassword('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>
        <Typography variant="h5" component="div" align="center" fontWeight="500">
          Login Required
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <FormControlLabel
            control={
              <Checkbox
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                color="primary"
              />
            }
            label="Remember me"
          />
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogin}
          disabled={loading}
          sx={{ ml: 2, minWidth: 100 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Login'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginModal;
