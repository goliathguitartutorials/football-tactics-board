import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import '../styles/Auth.css';

const Auth = ({ onClose, initialView = 'login' }) => {
  const [view, setView] = useState(initialView);
  
  const toggleView = () => {
    setView(view === 'login' ? 'register' : 'login');
  };
  
  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {view === 'login' ? (
          <>
            <Login onClose={onClose} />
            <div className="auth-toggle">
              <p>Don't have an account? <button onClick={toggleView}>Sign Up</button></p>
            </div>
          </>
        ) : (
          <>
            <Register onClose={onClose} />
            <div className="auth-toggle">
              <p>Already have an account? <button onClick={toggleView}>Log In</button></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth; 