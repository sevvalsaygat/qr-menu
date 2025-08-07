'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  email: string;
  restaurantName: string;
  createdAt: { toDate?: () => Date } | Date;
  lastLoginAt: { toDate?: () => Date } | Date;
  isActive: boolean;
  emailVerified: boolean;
  subscription: {
    plan: string;
    status: string;
    expiresAt: { toDate?: () => Date } | Date;
  };
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    address: Record<string, unknown>;
  };
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  hasCompletedSetup: boolean;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 * Wraps the app to provide authentication state
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              setUserData(doc.data() as UserData);
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

  const value: AuthContextType = {
    user,
    userData,
    loading,
    error,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
    hasCompletedSetup: !!(userData?.restaurantName && userData?.emailVerified)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * @returns Authentication state and methods
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Hook for protecting routes that require authentication
 * Redirects to login if not authenticated
 * @param options - Configuration options
 * @returns Authentication state
 */
export function useRequireAuth({ 
  redirectTo = '/signin', 
  requireEmailVerification = false 
}: {
  redirectTo?: string;
  requireEmailVerification?: boolean;
} = {}): AuthContextType & { isRedirecting: boolean } {
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