'use client'

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { onAuthStateChange, getUserData } from '../lib/auth'
import { UserData, AuthContextType } from '../types'

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser: User | null) => {
      try {
        setError(null)
        
        if (firebaseUser) {
          // User is signed in
          setUser(firebaseUser)
          
          // Get additional user data from Firestore
          const data = await getUserData(firebaseUser.uid)
          setUserData(data)
        } else {
          // User is signed out
          setUser(null)
          setUserData(null)
        }
      } catch (err: unknown) {
        console.error('Error in auth state change:', err)
        const error = err as Error
        setError(error.message || 'Authentication error occurred')
      } finally {
        setLoading(false)
      }
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    userData,
    loading,
    error,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Custom hook for protected routes
export function useRequireAuth() {
  const auth = useAuth()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      setShouldRedirect(true)
    } else if (!auth.loading && auth.isAuthenticated && !auth.isEmailVerified) {
      setShouldRedirect(true)
    } else {
      setShouldRedirect(false)
    }
  }, [auth.loading, auth.isAuthenticated, auth.isEmailVerified])

  return {
    ...auth,
    shouldRedirect
  }
}

// Hook for restaurant data
export function useRestaurant() {
  const { user, userData, isAuthenticated } = useAuth()
  
  return {
    restaurantName: userData?.restaurantName || '',
    isOwner: isAuthenticated && !!userData?.restaurantName,
    userId: user?.uid || null
  }
}
