'use client';

import { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';


// Create auth context
const AuthContext = createContext();

/**
 * Auth Provider Component
 * Wraps the app to provide authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        try {
          // Set up real-time listener for user data
          const userRef = doc(db, 'users', firebaseUser.uid);
          const unsubscribeUserData = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
              setUserData(doc.data());
            } else {
              setUserData(null);
            }
          }, (error) => {
            console.error('Error listening to user data:', error);
            setError('Failed to load user data');
          });

          setUser(firebaseUser);

          // Clean up user data listener when user changes
          return () => unsubscribeUserData();
        } catch (error) {
          console.error('Error setting up user data listener:', error);
          setError('Failed to initialize user session');
          setUser(null);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    userData,
    loading,
    error,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
    hasCompletedSetup: userData?.restaurantName && userData?.emailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * @returns {Object} Authentication state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook for protecting routes that require authentication
 * Redirects to login if not authenticated
 * @param {Object} options - Configuration options
 * @param {string} options.redirectTo - Redirect path for unauthenticated users
 * @param {boolean} options.requireEmailVerification - Whether to require email verification
 * @returns {Object} Authentication state
 */
export function useRequireAuth({ 
  redirectTo = '/signin', 
  requireEmailVerification = false 
} = {}) {
  const auth = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!auth.loading) {
      if (!auth.isAuthenticated) {
        setIsRedirecting(true);
        window.location.href = redirectTo;
        return;
      }

      if (requireEmailVerification && !auth.isEmailVerified) {
        setIsRedirecting(true);
        window.location.href = '/verify-email';
        return;
      }
    }
  }, [auth.loading, auth.isAuthenticated, auth.isEmailVerified, redirectTo, requireEmailVerification]);

  return {
    ...auth,
    isRedirecting
  };
}