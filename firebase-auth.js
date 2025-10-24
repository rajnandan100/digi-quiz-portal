// Firebase Authentication Service
// DigiQuiz Portal - User Authentication
// ====================================

import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  increment,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { auth, db, googleProvider } from './firebase-config.js';

// Current user state
let currentUser = null;
let authStateCallbacks = [];

// Authentication Events
export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth:login:success',
  LOGOUT_SUCCESS: 'auth:logout:success',
  AUTH_ERROR: 'auth:error',
  USER_UPDATED: 'auth:user:updated'
};

// Google Sign-In Function
export async function signInWithGoogle() {
  try {
    console.log('🔐 Starting Google Sign-In...');
    
    // Configure popup settings
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    
    // Sign in with popup
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    console.log('✅ Google Sign-In successful:', user.displayName);
    
    // Create/update user in Firestore
    await createOrUpdateUser(user);
    
    // Dispatch login event
    dispatchAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, {
      user: formatUser(user),
      isNewUser: result._tokenResponse?.isNewUser || false
    });
    
    return formatUser(user);
    
  } catch (error) {
    console.error('❌ Google Sign-In failed:', error);
    
    // Handle specific auth errors
    let errorMessage = 'Authentication failed';
    
    switch (error.code) {
      case 'auth/popup-blocked':
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
        break;
      case 'auth/popup-closed-by-user':
        errorMessage = 'Sign-in was cancelled.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
      default:
        errorMessage = error.message || 'Authentication failed';
    }
    
    dispatchAuthEvent(AUTH_EVENTS.AUTH_ERROR, { error: errorMessage });
    throw new Error(errorMessage);
  }
}

// Sign Out Function
export async function signOutUser() {
  try {
    console.log('🚪 Signing out user...');
    
    const userName = currentUser?.displayName || 'User';
    await signOut(auth);
    
    currentUser = null;
    console.log('✅ Sign-out successful');
    
    // Dispatch logout event
    dispatchAuthEvent(AUTH_EVENTS.LOGOUT_SUCCESS, { userName });
    
    return true;
    
  } catch (error) {
    console.error('❌ Sign-out failed:', error);
    dispatchAuthEvent(AUTH_EVENTS.AUTH_ERROR, { error: 'Sign-out failed' });
    throw error;
  }
}

// Create or Update User in Firestore
async function createOrUpdateUser(user) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    const userData = {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    if (userSnap.exists()) {
      // Update existing user
      await updateDoc(userRef, {
        ...userData,
        loginCount: increment(1)
      });
      console.log('👤 User profile updated');
    } else {
      // Create new user
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        loginCount: 1,
        totalQuizzes: 0,
        totalScore: 0,
        averageScore: 0,
        rank: 0,
        achievements: [],
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      });
      console.log('👤 New user profile created');
    }
    
  } catch (error) {
    console.error('❌ Failed to create/update user:', error);
    // Don't throw here, as auth was successful
  }
}

// Format user data
function formatUser(user) {
  return {
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    photo: user.photoURL,
    emailVerified: user.emailVerified,
    creationTime: user.metadata.creationTime,
    lastSignInTime: user.metadata.lastSignInTime
  };
}

// Get current user data from Firestore
export async function getUserData(uid = null) {
  try {
    const userId = uid || currentUser?.uid;
    if (!userId) return null;
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to get user data:', error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(updates) {
  try {
    if (!currentUser) throw new Error('No user signed in');
    
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ User profile updated');
    dispatchAuthEvent(AUTH_EVENTS.USER_UPDATED, updates);
    
  } catch (error) {
    console.error('❌ Failed to update profile:', error);
    throw error;
  }
}

// Auth State Observer
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    
    if (user) {
      console.log('👤 User signed in:', user.displayName);
    } else {
      console.log('👤 User signed out');
    }
    
    // Call all registered callbacks
    authStateCallbacks.forEach(cb => cb(user));
    
    // Call the main callback
    if (callback) callback(user);
  });
}

// Add auth state callback
export function addAuthStateCallback(callback) {
  authStateCallbacks.push(callback);
}

// Remove auth state callback
export function removeAuthStateCallback(callback) {
  const index = authStateCallbacks.indexOf(callback);
  if (index > -1) {
    authStateCallbacks.splice(index, 1);
  }
}

// Get current user
export function getCurrentUser() {
  return currentUser;
}

// Check if user is signed in
export function isSignedIn() {
  return !!currentUser;
}

// Dispatch custom auth events
function dispatchAuthEvent(eventType, data = {}) {
  const event = new CustomEvent(eventType, {
    detail: data,
    bubbles: true
  });
  window.dispatchEvent(event);
}

// Initialize auth state listener
onAuthStateChange((user) => {
  // This will be called automatically when auth state changes
});

console.log('🔐 Firebase Authentication service loaded');
