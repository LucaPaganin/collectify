import { createContext, useContext } from 'react';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import useAuthUser from 'react-auth-kit/hooks/useAuthUser';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated';
import axios from 'axios';

// Create a context for compatibility with existing code
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const signOut = useSignOut();
  const currentUser = useAuthUser();
  const isAuthenticated = useIsAuthenticated();

  // Register function
  const register = async (username, password, email) => {
    try {
      await axios.post('/api/auth/register', { username, email, password });
      return true;
    } catch (err) {
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    signOut();
  };

  // Context value for compatibility with existing code
  const value = {
    currentUser,
    loading: false,
    error: null,
    register,
    logout,
    isAuthenticated: isAuthenticated,
    isAdmin: currentUser?.is_admin || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the AuthContext as default
export default AuthContext;
