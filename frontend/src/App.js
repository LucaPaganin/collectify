import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from 'react-auth-kit/AuthProvider';
import createStore from 'react-auth-kit/createStore';
import { refreshApi, setupAuthInterceptor } from './utils/authUtils';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import SearchPage from './containers/SearchPage.jsx';
import AdminPage from './containers/AdminPage.jsx';
import LoginPage from './containers/LoginPage.jsx';
import ApiStatus from './components/ApiStatus';
import { testApiConnection, suggestAlternativeApiUrl } from './utils/connectionUtils';
import config from './config';

// Set up auth store
const authStore = createStore({
  authName: '_auth',
  authType: 'cookie',
  cookieDomain: window.location.hostname,
  cookieSecure: window.location.protocol === 'https:',
  refresh: refreshApi
});

// Set up axios interceptors for authentication
setupAuthInterceptor(() => {
  // Access the token correctly from the auth state
  let token;
  const authVal = authStore.tokenObject.value;
  console.log(`authVal: ${JSON.stringify(authVal)}`);
  if (authVal.isSignIn){
    token = authVal.auth.token;
  }
  else if (authVal.isUsingRefreshToken) {
    token = authVal.refresh?.token;
  }
  return token || null;
});

// Custom PrivateRoute component instead of using RequireAuth
const PrivateRoute = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  
  if (!isAuthenticated()) {
    // Redirect to login with return URL
    return <Navigate to="/login?returnUrl=/admin" replace />;
  }
  
  return children;
};

function App() {
  const [apiStatus, setApiStatus] = useState({
    checked: false,
    connected: true,
    suggestedUrl: null
  });
  
  // Check API connectivity on component mount
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        const result = await testApiConnection();
        const isConnected = result.connectionStatus === 'success';
        const suggestedUrl = isConnected ? null : suggestAlternativeApiUrl();
        
        setApiStatus({
          checked: true,
          connected: isConnected,
          suggestedUrl: suggestedUrl
        });
        
        console.log('API connection check:', isConnected ? 'Connected' : 'Failed');
        if (suggestedUrl) {
          console.log('Suggested alternative API URL:', suggestedUrl);
        }
      } catch (error) {
        console.error('Error checking API connection:', error);
        setApiStatus({
          checked: true,
          connected: false,
          suggestedUrl: suggestAlternativeApiUrl()
        });
      }
    };
    
    checkApiConnection();
  }, []);
  
  // API Connectivity warning component
  const ApiConnectivityWarning = () => {
    if (!apiStatus.checked || apiStatus.connected) {
      return null;
    }
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f8d7da',
        color: '#721c24',
        padding: '10px 20px',
        zIndex: 9999,
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <p style={{ margin: '0 0 5px 0' }}>
          <strong>API Connection Error:</strong> Unable to connect to the API server at <code>{config.apiUrl}</code>
        </p>
        {apiStatus.suggestedUrl && (
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
            Try accessing the app using this URL instead: <a href={apiStatus.suggestedUrl.replace('/api', '')} style={{ color: '#721c24', textDecoration: 'underline' }}>{apiStatus.suggestedUrl.replace('/api', '')}</a>
          </p>
        )}
      </div>
    );
  };
  
  return (
    <AuthProvider store={authStore}>
      <Router>
        <ApiConnectivityWarning />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute>
                <AdminPage />
              </PrivateRoute>
            } 
          />
        </Routes>
        {/* Show API status in development mode or if there's a connection issue */}
        <ApiStatus visible={process.env.NODE_ENV === 'development' || !apiStatus.connected} />
      </Router>
    </AuthProvider>
  );
}

export default App;
