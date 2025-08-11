import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useSignIn from 'react-auth-kit/hooks/useSignIn';
import { api } from '../utils/authUtils';
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

// Login Form Component
const LoginForm = ({ onLogin, loading }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className={styles.form}>
      <TextField
        name="username"
        label="Username"
        variant="outlined"
        fullWidth
        value={formData.username}
        onChange={handleChange}
        required
        margin="normal"
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        variant="outlined"
        fullWidth
        value={formData.password}
        onChange={handleChange}
        required
        margin="normal"
      />
      <FormControlLabel
        control={
          <Checkbox 
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
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
        disabled={loading}
        className={styles.submitButton}
      >
        {loading ? <CircularProgress size={24} /> : 'Login'}
      </Button>
    </Box>
  );
};

// Register Form Component
const RegisterForm = ({ onRegister, loading }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} className={styles.form}>
      <TextField
        name="username"
        label="Username"
        variant="outlined"
        fullWidth
        value={formData.username}
        onChange={handleChange}
        required
        margin="normal"
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        variant="outlined"
        fullWidth
        value={formData.email}
        onChange={handleChange}
        required
        margin="normal"
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        variant="outlined"
        fullWidth
        value={formData.password}
        onChange={handleChange}
        required
        margin="normal"
      />
      <TextField
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        variant="outlined"
        fullWidth
        value={formData.confirmPassword}
        onChange={handleChange}
        required
        margin="normal"
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={loading}
        className={styles.submitButton}
      >
        {loading ? <CircularProgress size={24} /> : 'Register'}
      </Button>
    </Box>
  );
};

// Main LoginPage Component
const LoginPage = () => {
  // UI state
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

  const handleTabChange = useCallback((event, newValue) => {
    setUiState(prevState => ({
      ...prevState,
      tab: newValue,
      error: '',
      success: ''
    }));
  }, []);

  // Handle login submission from child component
  const handleLogin = useCallback(async (formData) => {
    setUiState(prevState => ({ ...prevState, loading: true, error: '' }));

    try {
      const response = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password
      });

      // Defensive: check for expected fields
      const data = response.data;
      if (!data || !data.token || !data.refreshToken || !data.user) {
        setUiState(prevState => ({
          ...prevState,
          loading: false,
          error: 'Unexpected server response. Please try again or contact support.'
        }));
        return;
      }

      const { token, refreshToken, user } = data;
      const realUser = {
        name: user.username,
        uid: user.id,
        email: user.email,
        isAdmin: user.is_admin
      };

      try {
        // Use react-auth-kit's signIn function
        const signInResult = signIn({
          auth: {
            token: token,
            type: 'Bearer'
          },
          refresh: refreshToken,
          userState: realUser
        });

        if (signInResult) {
          // Redirect to the return URL or admin page
          // Use a timeout to ensure state updates are processed before navigation
          setTimeout(() => {
            navigate(returnUrl);
          }, 100);
        } else {
          setUiState(prevState => ({
            ...prevState,
            loading: false,
            error: 'Failed to sign in. Please try again.'
          }));
        }
      } catch (signInError) {
        console.error('SignIn Error:', signInError);
        setUiState(prevState => ({
          ...prevState,
          loading: false,
          error: `Authentication error: ${signInError.message}`
        }));
      }
    } catch (error) {
      setUiState(prevState => ({
        ...prevState,
        loading: false,
        error: error.response?.data?.error || `Login failed: ${error.message}`
      }));
    }
  }, [signIn, navigate, returnUrl]);

  // Handle registration submission from child component
  const handleRegister = useCallback(async (formData) => {
    setUiState(prevState => ({ ...prevState, loading: true, error: '', success: '' }));

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setUiState(prevState => ({
        ...prevState,
        loading: false,
        error: 'Passwords do not match'
      }));
      return;
    }

    try {
  await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      setUiState(prevState => ({
        ...prevState,
        loading: false,
        tab: 0, // Switch to login tab
        success: 'Registration successful! You can now log in.'
      }));
    } catch (error) {
      setUiState(prevState => ({
        ...prevState,
        loading: false,
        error: error.response?.data?.error || 'Registration failed. Please try again.'
      }));
    }
  }, []);

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
          <LoginForm 
            onLogin={handleLogin} 
            loading={uiState.loading} 
          />
        ) : (
          <RegisterForm 
            onRegister={handleRegister} 
            loading={uiState.loading} 
          />
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
