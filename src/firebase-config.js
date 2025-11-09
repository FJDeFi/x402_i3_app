// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Your Firebase configuration object
// Firebase project: i3-testnet
const firebaseConfig = {
  apiKey: "AIzaSyCYdWqXjUfNbUAMW1cm8neZQGTBTA63pfM",
  authDomain: "i3-testnet.firebaseapp.com",
  projectId: "i3-testnet",
  storageBucket: "i3-testnet.firebasestorage.app",
  messagingSenderId: "892139814159",
  appId: "1:892139814159:web:4df8548eef1d9bd9a1927a",
  measurementId: "G-KCDG3D1FCC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Google Sign In function
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Save user data to Firestore
    await saveUserToFirestore(user);
    
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign Out function
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Save user data to Firestore
export const saveUserToFirestore = async (user) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date(),
      createdAt: new Date(),
      isActive: true
    };
    
    await setDoc(userRef, userData, { merge: true });
    console.log('User data saved to Firestore');
  } catch (error) {
    console.error('Error saving user data:', error);
    throw error;
  }
};

// Get user data from Firestore
export const getUserFromFirestore = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log('No user document found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

// Update user credits
export const updateUserCredits = async (uid, newCredits) => {
  console.warn('updateUserCredits is deprecated: credits are stored in wallets, not users');
};

// Auth state observer
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

export { auth, db }; 