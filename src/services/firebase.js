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
  onSnapshot,
  query,
  orderBy,
  where,
  deleteDoc 
} from 'firebase/firestore';

// Firebase configuration
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

// Enable offline persistence - this helps with offline functionality and may improve performance
import { enableIndexedDbPersistence } from "firebase/firestore";
try {
  enableIndexedDbPersistence(db);
  console.log("Offline persistence enabled");
} catch (error) {
  console.error("Error enabling offline persistence:", error);
}

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
    console.log('Saving board for user:', userId, boardData.name);
    const boardsRef = collection(db, "users", userId, "boards");
    
    // Adding a timestamp for sorting
    const dataToSave = {
      ...boardData,
      updatedAt: new Date().toISOString(),
      userId: userId // Add userId to make security rules easier
    };
    
    await setDoc(doc(boardsRef, boardData.name), dataToSave);
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
    const q = query(boardsRef, orderBy("updatedAt", "desc")); // Sort by last updated
    const querySnapshot = await getDocs(q);
    
    const boards = [];
    querySnapshot.forEach((doc) => {
      boards.push(doc.data());
    });
    
    console.log('Fetched boards:', boards.length);
    return boards;
  } catch (error) {
    console.error("Error getting user tactics boards:", error);
    throw error;
  }
};

// Add a real-time listener for tactics boards
export const onTacticsBoardsChange = (userId, callback) => {
  if (!userId) return () => {}; // Return a no-op unsubscribe function if no userId

  console.log('Setting up real-time listener for user:', userId);
  const boardsRef = collection(db, "users", userId, "boards");
  const q = query(boardsRef, orderBy("updatedAt", "desc")); // Sort by last updated
  
  // Set up real-time listener
  return onSnapshot(q, (snapshot) => {
    const boards = [];
    snapshot.forEach((doc) => {
      boards.push(doc.data());
    });
    console.log('Real-time update, fetched boards:', boards.length);
    callback(boards);
  }, (error) => {
    console.error("Error in real-time listener:", error);
  });
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