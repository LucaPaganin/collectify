import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RequireAuth from '@auth-kit/react-router/RequireAuth';
import SearchPage from './containers/SearchPage.jsx';
import AdminPage from './containers/AdminPage.jsx';
import LoginPage from './containers/LoginPage.jsx';

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <RequireAuth fallbackPath="/login?returnUrl=/admin">
              <AdminPage />
            </RequireAuth>
          } />
        </Routes>
      </Router>
  );
}

export default App;
