// src/app/utils/auth.js
"use client";

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user from storage:', error);
    return null;
  }
};

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    window.location.href = '/'; // Redirect to main page instead of login
  }
};