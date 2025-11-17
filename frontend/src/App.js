import './App.css';
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthProvider from 'react-auth-kit/AuthProvider';
import SearchPage from './containers/SearchPage.jsx';
import AdminPage from './containers/AdminPage.jsx';
import LoginPage from './containers/LoginPage.jsx';
import ApiConnectivityWarning from './components/ApiConnectivityWarning';
import ApiStatus from './components/ApiStatus';
import PrivateRoute from './components/PrivateRoute.jsx';
import { resolveApiStatus } from './utils/apiStatus';
import authStore from './auth/store';
import config from './config';

function App() {
  const [apiStatus, setApiStatus] = useState({
    checked: false,
    connected: true,
    suggestedUrl: null
  });
  
  // Check API connectivity on component mount
  useEffect(() => {
    let isMounted = true;

    resolveApiStatus().then((status) => {
      if (isMounted) {
        setApiStatus(status);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);
  
  return (
    <AuthProvider store={authStore}>
      <Router>
        <ApiConnectivityWarning apiStatus={apiStatus} apiUrl={config.apiUrl} />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={(
              <PrivateRoute redirectTo="/login?returnUrl=/admin">
                <AdminPage />
              </PrivateRoute>
            )}
          />
        </Routes>
        {/* Show API status in development mode or if there's a connection issue */}
        <ApiStatus visible={process.env.NODE_ENV === 'development' || !apiStatus.connected} />
      </Router>
    </AuthProvider>
  );
}

export default App;
