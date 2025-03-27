import { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChange,
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  signInWithGoogle,
  logoutUser
} from '../services/firebase';

// Create the authentication context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component to wrap the app
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign up with email and password
  const signup = async (email, password) => {
    try {
      setError(null);
      await registerWithEmailAndPassword(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      setError(null);
      await loginWithEmailAndPassword(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      await logoutUser();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Effect to subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    signup,
    login,
    loginWithGoogle,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 