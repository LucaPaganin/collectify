import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { setupAuthInterceptor } from './utils/authUtils';
import createStore from 'react-auth-kit/createStore';
import AuthProvider from 'react-auth-kit';
import { refreshApi } from './utils/authUtils';

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
  const token = authStore.token;
  console.log('Auth token retrieved:', token ? 'Present' : 'Not present');
  return token || null;
});

console.log('Auth store:', authStore);
console.log('Auth store token:', authStore.token);
console.log('About to render with AuthProvider');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {console.log('Before AuthProvider render')}
    <AuthProvider store={authStore}>
      {console.log('Inside AuthProvider - about to render App')}
      <App />
    </AuthProvider>
    {console.log('After AuthProvider render')}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
