import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  // Form and UI state management
  const [formState, setFormState] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: '',
    rememberMe: false
  });
  
  const [uiState, setUiState] = useState({
    tab: 0,
    loading: false,
    error: '',
    success: ''
  });

  // Auth hooks from react-auth-kit
  const signIn = useSignIn();
  const navigate = useNavigate();
  
  // Get the return URL from query parameters or default to "/"
  const queryParams = new URLSearchParams(window.location.search);
  const returnUrl = queryParams.get('returnUrl') || '/';

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormState({
      ...formState,
      [name]: name === 'rememberMe' ? checked : value
    });
  };

  const handleTabChange = (event, newValue) => {
    setUiState({
      ...uiState,
      tab: newValue,
      error: '',
      success: ''
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setUiState({ ...uiState, loading: true, error: '' });

    try {
      const response = await axios.post('/api/auth/login', {
        username: formState.username,
        password: formState.password
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Use react-auth-kit's signIn function
      const signInResult = signIn({
        token,
        refreshToken,
        expiresIn: 60 * 60, // 1 hour
        refreshTokenExpireIn: formState.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days if remember me, 7 days otherwise
        tokenType: 'Bearer',
        authState: user // Store user info in auth state
      });
      
      if (signInResult) {
        // Redirect to the return URL or admin page
        navigate(returnUrl);
      } else {
        setUiState({
          ...uiState,
          loading: false,
          error: 'Failed to sign in. Please try again.'
        });
      }
    } catch (error) {
      setUiState({
        ...uiState,
        loading: false,
        error: error.response?.data?.error || 'Login failed. Please check your credentials.'
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setUiState({ ...uiState, loading: true, error: '', success: '' });

    // Basic validation
    if (formState.password !== formState.confirmPassword) {
      setUiState({
        ...uiState,
        loading: false,
        error: 'Passwords do not match'
      });
      return;
    }

    try {
      await axios.post('/api/auth/register', {
        username: formState.username,
        email: formState.email,
        password: formState.password
      });
      
      setUiState({
        ...uiState,
        loading: false,
        tab: 0, // Switch to login tab
        success: 'Registration successful! You can now log in.'
      });
      
      // Clear registration form fields
      setFormState({
        ...formState,
        email: '',
        confirmPassword: ''
      });
    } catch (error) {
      setUiState({
        ...uiState,
        loading: false,
        error: error.response?.data?.error || 'Registration failed. Please try again.'
      });
    }
  };

  return (
    <Container maxWidth="sm" className={styles.container}>
      <Paper elevation={3} className={styles.paper}>
        <Box className={styles.logoContainer}>
          <Typography variant="h4" component="h1" fontWeight="500" color="primary">
            Collectify
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your collection
          </Typography>
        </Box>

        <Tabs 
          value={uiState.tab} 
          onChange={handleTabChange} 
          variant="fullWidth" 
          className={styles.tabs}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        {uiState.error && (
          <Alert severity="error" className={styles.alert}>
            {uiState.error}
          </Alert>
        )}

        {uiState.success && (
          <Alert severity="success" className={styles.alert}>
            {uiState.success}
          </Alert>
        )}

        {uiState.tab === 0 ? (
          <Box component="form" onSubmit={handleLogin} className={styles.form}>
            <TextField
              name="username"
              label="Username"
              variant="outlined"
              fullWidth
              value={formState.username}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={formState.password}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  name="rememberMe"
                  checked={formState.rememberMe}
                  onChange={handleInputChange}
                  color="primary"
                />
              }
              label="Remember me"
              className={styles.rememberMe}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={uiState.loading}
              className={styles.submitButton}
            >
              {uiState.loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleRegister} className={styles.form}>
            <TextField
              name="username"
              label="Username"
              variant="outlined"
              fullWidth
              value={formState.username}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              value={formState.email}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={formState.password}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <TextField
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              variant="outlined"
              fullWidth
              value={formState.confirmPassword}
              onChange={handleInputChange}
              required
              margin="normal"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={uiState.loading}
              className={styles.submitButton}
            >
              {uiState.loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
          </Box>
        )}

        <Box className={styles.footer}>
          <Button variant="text" component={Link} to="/">
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
