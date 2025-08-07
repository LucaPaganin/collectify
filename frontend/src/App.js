import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RequireAuth } from 'react-auth-kit';
import SearchPage from './containers/SearchPage';
import AdminPage from './containers/AdminPage';
import LoginPage from './containers/LoginPage';
// import { AuthProvider as CompatAuthProvider } from './context/CompatAuthContext';

function App() {
  return (
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
  );
}

export default App;
