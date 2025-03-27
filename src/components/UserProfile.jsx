import { useAuth } from '../context/AuthContext';
import '../styles/UserProfile.css';

const UserProfile = ({ onClose }) => {
  const { currentUser, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <div className="user-profile">
      <div className="profile-header">
        <h3>User Profile</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="profile-content">
        <div className="profile-avatar">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="User Avatar" />
          ) : (
            <div className="avatar-placeholder">
              {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        
        <div className="profile-info">
          <p className="profile-email">{currentUser?.email || 'No email available'}</p>
          <p className="profile-id">User ID: {currentUser?.uid?.substring(0, 8) || 'Unknown'}</p>
        </div>
        
        <button className="logout-button" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserProfile; 