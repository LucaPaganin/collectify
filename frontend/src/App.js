import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RequireAuth from 'react-auth-kit';
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
            <RequireAuth fallbackPath="/login">
              <AdminPage />
            </RequireAuth>
          } />
        </Routes>
      </Router>
  );
}

export default App;
