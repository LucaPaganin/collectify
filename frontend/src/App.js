import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from 'react-auth-kit';
import { RequireAuth } from 'react-auth-kit';
import SearchPage from './containers/SearchPage';
import AdminPage from './containers/AdminPage';
import LoginPage from './containers/LoginPage';
import { AuthProvider as CompatAuthProvider } from './context/CompatAuthContext';

function App({ authStore }) {
  return (
    <AuthProvider store={authStore}>
      <CompatAuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={
              <RequireAuth fallbackPath="/login">
                <AdminPage />
              </RequireAuth>
            } />
          </Routes>
        </Router>
      </CompatAuthProvider>
    </AuthProvider>
  );
}

export default App;
