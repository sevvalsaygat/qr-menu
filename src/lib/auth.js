import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { createRestaurantForUser } from './firestore';

/**
 * Sign up a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} restaurantName - Restaurant/Company name
 * @returns {Promise<Object>} User object with additional data
 */
export const signUp = async (email, password, restaurantName) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);

    // Create user document in Firestore
    const userData = {
      email: user.email,
      restaurantName,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
      emailVerified: false,
      subscription: {
        plan: 'trial',
        status: 'active',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      },
      profile: {
        firstName: '',
        lastName: '',
        phone: '',
        address: {}
      }
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    // Create a restaurant for this owner and link on user
    await createRestaurantForUser({ ownerId: user.uid, name: restaurantName });

    return {
      user,
      userData,
      needsEmailVerification: true
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign in user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object with additional data
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login time
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });

    // Get user data from Firestore
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : null;

    return {
      user,
      userData
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Sign out the current user
 */
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch {
    throw new Error('Failed to sign out. Please try again.');
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

/**
 * Resend email verification
 * @param {Object} user - Current user object
 */
export const resendEmailVerification = async (user) => {
  try {
    await sendEmailVerification(user);
  } catch {
    throw new Error('Failed to send verification email. Please try again.');
  }
};

/**
 * Get user data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User data or null
 */
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

/**
 * Convert Firebase auth error codes to user-friendly messages
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
const getAuthErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/requires-recent-login':
      return 'Please sign in again to complete this action.';
    default:
      return 'An error occurred. Please try again.';
  }
};