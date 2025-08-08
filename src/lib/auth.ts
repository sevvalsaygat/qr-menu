import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import { UserData, ApiResponse } from '../types'

// Sign up with email and password
export const signUp = async (
  email: string, 
  password: string, 
  restaurantName: string
): Promise<ApiResponse<{ user: User }>> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Send email verification
    await sendEmailVerification(user)
    
    // Create user document in Firestore
    const userData: Partial<UserData> = {
      email: user.email!,
      restaurantName,
      createdAt: serverTimestamp(),
      isActive: false, // Will be activated after email verification
      emailVerified: false
    }
    
    await setDoc(doc(db, 'users', user.uid), userData)
    
    return { success: true, data: { user } }
  } catch (error: unknown) {
    console.error('Error signing up:', error)
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
    
    // Check if email is verified
    if (!user.emailVerified) {
      return { 
        success: false, 
        error: 'Please verify your email before signing in' 
      }
    }
    
    // Update last login time
    await setDoc(doc(db, 'users', user.uid), {
      lastLoginAt: serverTimestamp()
    }, { merge: true })
    
    return { success: true, data: { user } }
  } catch (error: unknown) {
    console.error('Error signing in:', error)
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
  } catch (error: unknown) {
    console.error('Error signing out:', error)
    return { 
      success: false, 
      error: 'Failed to sign out' 
    }
  }
}

// Reset password
export const resetPassword = async (email: string): Promise<ApiResponse> => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error sending password reset email:', error)
    const firebaseError = error as { code?: string }
    return { 
      success: false, 
      error: getAuthErrorMessage(firebaseError.code || 'unknown') 
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
  } catch (error) {
    console.error('Error getting user data:', error)
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
      return 'Too many failed attempts. Please try again later'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection'
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
  } catch (error: unknown) {
    console.error('Error updating profile:', error)
    return { 
      success: false, 
      error: 'Failed to update profile' 
    }
  }
}

// Resend email verification
export const resendEmailVerification = async (): Promise<ApiResponse> => {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'No user logged in' }
    }
    
    await sendEmailVerification(auth.currentUser)
    return { success: true }
  } catch (error: unknown) {
    console.error('Error resending verification email:', error)
    return { 
      success: false, 
      error: 'Failed to resend verification email' 
    }
  }
}
