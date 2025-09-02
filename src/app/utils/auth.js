// src/app/utils/auth.js
"use client";

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  onAuthStateChanged,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';

// User session management
let currentUser = null;

// Listen for auth state changes
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      getCurrentUser(); // Refresh user data
    } else {
      // User is signed out
      currentUser = null;
      localStorage.removeItem('user');
    }
  });
}

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Return cached user if available
    if (currentUser) return currentUser;
    
    const user = localStorage.getItem('user');
    if (user) {
      currentUser = JSON.parse(user);
      return currentUser;
    }
    return null;
  } catch (error) {
    console.warn('Error getting user from storage:', error);
    return null;
  }
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
};

export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Store user data in localStorage
      const userInfo = {
        uid: user.uid,
        name: userData.name,
        email: user.email,
        role: userData.role,
        department: userData.department,
        avatar: userData.avatar || '/default-avatar.png',
        lastLogin: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(userInfo));
      currentUser = userInfo;
      
      // Update last login time in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        lastLogin: new Date()
      }, { merge: true });
      
      return { success: true, user: userInfo };
    } else {
      return { 
        success: false, 
        error: 'User data not found. Please contact support.' 
      };
    }
  } catch (error) {
    // Downgrade to warn to avoid Next dev overlay for handled errors
    console.warn('Login error:', error);
    let errorMessage = 'Login failed. Please try again.';
    
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'User account has been disabled.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No user found with this email.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection.';
        break;
      case 'permission-denied':
        errorMessage = 'Your account does not have permission to access user data. Please contact support.';
        break;
      default:
        errorMessage = error.message || 'Login failed. Please try again.';
    }
    
    return { success: false, error: errorMessage };
  }
};

export const registerWithEmailAndPassword = async (userData) => {
  try {
    const { name, email, password, department } = userData;

    // Normalize email and pre-check if already in use
    const normalizedEmail = (email || '').trim().toLowerCase();
    const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
    if (methods && methods.length > 0) {
      // Early return with friendly message instead of throwing
      return { success: false, error: 'This email is already registered. Please sign in instead.' };
    }
    
    // Create user with Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const user = userCredential.user;
    
    // Update user profile with display name
    await updateProfile(user, {
      displayName: name
    });
    
    // Determine role based on email (admin@fedpioneer.com gets admin role)
    const role = normalizedEmail === 'admin@fedpioneer.com' ? 'admin' : 'user';
    
    // Save additional user data to Firestore
    const userInfo = {
      uid: user.uid,
      name: name,
      email: normalizedEmail,
      department: department,
      role: role,
      createdAt: new Date(),
      lastLogin: new Date(),
      avatar: role === 'admin' ? '/admin-avatar.png' : '/default-avatar.png',
      isActive: true
    };
    
    await setDoc(doc(db, 'users', user.uid), userInfo);
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userInfo));
    currentUser = userInfo;
    
    return { success: true, user: userInfo };
  } catch (error) {
    // Downgrade to warn to avoid Next dev overlay for handled errors
    console.warn('Registration error:', error);
    let errorMessage = 'Registration failed. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered. Please sign in instead.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please choose a stronger password (at least 6 characters).';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password accounts are not enabled. Please contact support.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection.';
        break;
      case 'permission-denied':
        errorMessage = 'Your account does not have permission to create user data. Please contact support or adjust Firestore rules.';
        break;
      default:
        errorMessage = error.message || 'Registration failed. Please try again.';
    }
    
    return { success: false, error: errorMessage };
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Logout error:', error);
  } finally {
    currentUser = null;
    localStorage.removeItem('user');
    // Use router.push instead of window.location for better UX
    if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  }
};

// Utility function to refresh user data
export const refreshUserData = async () => {
  const user = getCurrentUser();
  if (!user) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const updatedUser = {
        ...user,
        ...userData
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      currentUser = updatedUser;
      return updatedUser;
    }
  } catch (error) {
    console.warn('Error refreshing user data:', error);
  }
  
  return user;
};