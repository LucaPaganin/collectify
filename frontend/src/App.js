import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SearchPage from './containers/SearchPage';
import AdminPage from './containers/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
