import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import { UserData, ApiResponse } from '../types'
import { createRestaurant } from './firestore'

// Sign up with email and password
export const signUp = async (
  email: string, 
  password: string, 
  restaurantName: string
): Promise<ApiResponse<{ user: User }>> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Create user document in Firestore
    const userData: Partial<UserData> = {
      email: user.email!,
      restaurantName,
      createdAt: serverTimestamp(),
      isActive: true,
      emailVerified: true
    }
    
    await setDoc(doc(db, 'users', user.uid), userData)
    
    // Create default restaurant
    try {
      await createRestaurant(user.uid, {
        name: restaurantName,
        description: `Welcome to ${restaurantName}`,
        settings: {
          currency: '$',
          timezone: 'America/New_York',
          isActive: true
        }
      })
    } catch {
      // Continue with signup even if restaurant creation fails
      // The restaurant will be created later when user accesses tables
    }
    
    return { success: true, data: { user } }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string }
    return { 
      success: false, 
      error: getAuthErrorMessage(firebaseError.code || 'unknown') 
    }
  }
}

// Sign in with email and password
export const signIn = async (
  email: string, 
  password: string
): Promise<ApiResponse<{ user: User }>> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update last login time
    await setDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp()
    }, { merge: true })
    
    return { success: true, data: { user } }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string }
    return { 
      success: false, 
      error: getAuthErrorMessage(firebaseError.code || 'unknown') 
    }
  }
}

// Sign out
export const logOut = async (): Promise<ApiResponse> => {
  try {
    await signOut(auth)
    return { success: true }
  } catch {
    return { 
      success: false, 
      error: 'Failed to sign out' 
    }
  }
}

// Reset password
export const resetPassword = async (email: string): Promise<ApiResponse> => {
  try {
    // Validate email format
    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: 'Please enter a valid email address'
      }
    }

    // Get the base URL for password reset redirect
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    
    // Configure action code settings for password reset email
    const actionCodeSettings = {
      url: `${baseUrl}/auth/reset-password`,
      handleCodeInApp: false
    }

    console.log('Sending password reset email:', {
      email,
      redirectUrl: actionCodeSettings.url,
      baseUrl
    })
    
    await sendPasswordResetEmail(auth, email, actionCodeSettings)
    
    console.log('Password reset email sent successfully to:', email)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending password reset email:', error)
    const firebaseError = error as { code?: string; message?: string }
    const errorCode = firebaseError.code || 'unknown'
    const errorMessage = getAuthErrorMessage(errorCode)
    
    console.error('Firebase error details:', {
      code: errorCode,
      message: firebaseError.message,
      userMessage: errorMessage
    })
    
    return { 
      success: false, 
      error: errorMessage
    }
  }
}

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return userDoc.data() as UserData
    }
    return null
  } catch {
    throw new Error('Failed to get user data')
  }
}

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback)
}

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters'
    case 'auth/invalid-email':
      return 'Please enter a valid email address'
    case 'auth/user-not-found':
      return 'No account found with this email'
    case 'auth/wrong-password':
      return 'Incorrect password'
    case 'auth/too-many-requests':
      return 'Too many requests. Please try again later'
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection'
    case 'auth/invalid-credential':
      return 'Invalid email or password'
    default:
      return 'An error occurred. Please try again'
  }
}

// Update user profile
export const updateUserProfile = async (
  displayName?: string, 
  photoURL?: string
): Promise<ApiResponse> => {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'No user logged in' }
    }
    
    await updateProfile(auth.currentUser, {
      displayName,
      photoURL
    })
    
    return { success: true }
  } catch {
    return { 
      success: false, 
      error: 'Failed to update profile' 
    }
  }
}

// Update user restaurant name
export const updateUserRestaurantName = async (
  userId: string,
  restaurantName: string
): Promise<ApiResponse> => {
  try {
    await setDoc(doc(db, 'users', userId), {
      restaurantName
    }, { merge: true })
    
    return { success: true }
  } catch (error) {
    console.error('Error updating user restaurant name:', error)
    return { 
      success: false, 
      error: 'Failed to update restaurant name' 
    }
  }
}


