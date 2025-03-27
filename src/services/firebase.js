// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  deleteDoc 
} from 'firebase/firestore';

// Your Firebase configuration
// Replace these values with your actual Firebase project details
const firebaseConfig = {
    apiKey: "AIzaSyCa-qKXECagC4jNvLdw7MnVWWqitAJ3z-U",
    authDomain: "football-tactics-board-d5405.firebaseapp.com",
    projectId: "football-tactics-board-d5405",
    storageBucket: "football-tactics-board-d5405.appspot.com",
    messagingSenderId: "456088278412",
    appId: "1:456088278412:web:67965a307d9a84783632a9"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const registerWithEmailAndPassword = async (email, password) => {
  try {
    return await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error registering with email and password:", error);
    throw error;
  }
};

export const loginWithEmailAndPassword = async (email, password) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error logging in with email and password:", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Firestore functions for tactics boards
export const saveTacticsBoard = async (userId, boardData) => {
  try {
    console.log('Saving board for user:', userId, boardData);
    const boardsRef = collection(db, "users", userId, "boards");
    await setDoc(doc(boardsRef, boardData.name), {
      ...boardData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error saving tactics board:", error);
    throw error;
  }
};

export const getUserTacticsBoards = async (userId) => {
  try {
    console.log('Getting boards for user:', userId);
    const boardsRef = collection(db, "users", userId, "boards");
    const querySnapshot = await getDocs(boardsRef);
    
    const boards = [];
    querySnapshot.forEach((doc) => {
      boards.push(doc.data());
    });
    
    console.log('Fetched boards:', boards);
    return boards;
  } catch (error) {
    console.error("Error getting user tactics boards:", error);
    throw error;
  }
};

export const deleteTacticsBoard = async (userId, boardName) => {
  try {
    console.log('Deleting board:', userId, boardName);
    await deleteDoc(doc(db, "users", userId, "boards", boardName));
    return true;
  } catch (error) {
    console.error("Error deleting tactics board:", error);
    throw error;
  }
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, db }; 