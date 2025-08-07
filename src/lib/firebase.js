// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfCqx8zPLagkYVQpDZPbqheJTGjP5iqnk",
  authDomain: "qr-menu-c3d54.firebaseapp.com",
  projectId: "qr-menu-c3d54",
  storageBucket: "qr-menu-c3d54.firebasestorage.app",
  messagingSenderId: "1036990311415",
  appId: "1:1036990311415:web:6ae34440451607f7b0dcf2"
};

// Initialize Firebase (singleton-safe for Next.js Fast Refresh)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;