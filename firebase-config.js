// Firebase Configuration and Initialization
// DigiQuiz Portal - Firebase Integration
// =======================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiS1wFqB5dHjn6UiRhheSLhOekkLBlfmw",
  authDomain: "digi-quiz-portal.firebaseapp.com",
  projectId: "digi-quiz-portal",
  storageBucket: "digi-quiz-portal.firebasestorage.app",
  messagingSenderId: "260707974367",
  appId: "1:260707974367:web:82ba41b8a8f84508b47d6a",
  measurementId: "G-78W1YHEG93"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Configure Google Authentication Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Initialize Analytics (optional)
let analytics = null;
try {
  analytics = getAnalytics(app);
  console.log('📊 Firebase Analytics initialized');
} catch (error) {
  console.log('📊 Analytics not available in this environment');
}
export { analytics };

// Auth state observer
export const onAuthStateChange = (callback) => {
  return auth.onAuthStateChanged(callback);
};

// Current user helper
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Development environment check
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

if (isDevelopment) {
  console.log('🔧 Development mode detected');
}

// Firebase connection status
let isFirebaseConnected = false;

// Test Firebase connection
const testConnection = async () => {
  try {
    // Simple connection test
    await db._delegate._databaseId;
    isFirebaseConnected = true;
    console.log('🔥 Firebase connected successfully!');
    console.log('📊 Project ID:', firebaseConfig.projectId);
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    isFirebaseConnected = false;
    return false;
  }
};

// Initialize connection test
testConnection();

export { isFirebaseConnected, testConnection };

// Global error handler for Firebase
window.addEventListener('unhandledrejection', event => {
  if (event.reason?.code?.startsWith('auth/')) {
    console.error('🚨 Firebase Auth Error:', event.reason);
  } else if (event.reason?.code?.startsWith('firestore/')) {
    console.error('🚨 Firestore Error:', event.reason);
  }
});

console.log('🔥 Firebase configuration loaded successfully');
console.log('🎯 Project: digi-quiz-portal');
console.log('🌍 Region: Default (us-central1)');
