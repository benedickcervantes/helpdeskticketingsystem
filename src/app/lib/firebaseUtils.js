import { db } from '../firebaseconfig';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';

// Initialize sample categories
export const initializeCategories = async () => {
  const categories = [
    { id: 'hardware', name: 'Hardware', description: 'Computer hardware issues' },
    { id: 'software', name: 'Software', description: 'Software installation and issues' },
    { id: 'network', name: 'Network', description: 'Network connectivity problems' },
    { id: 'email', name: 'Email', description: 'Email account and client issues' },
    { id: 'security', name: 'Security', description: 'Security-related concerns' },
    { id: 'other', name: 'Other', description: 'Other technical issues' }
  ];

  try {
    for (const category of categories) {
      await setDoc(doc(db, 'categories', category.id), category);
    }
    console.log('Categories initialized successfully');
  } catch (error) {
    console.error('Error initializing categories:', error);
  }
};

// Create sample admin user (call this once to create an admin)
export const createSampleAdmin = async (email, password, name) => {
  try {
    // This would typically be done through the signup process
    // but with role set to 'admin'
    console.log('To create an admin user, sign up with email:', email);
    console.log('Then manually update the user role in Firestore to "admin"');
  } catch (error) {
    console.error('Error creating sample admin:', error);
  }
};

// Utility functions for ticket operations
export const ticketUtils = {
  getStatusColor: (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  },

  getPriorityColor: (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  },

  formatDate: (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
};

// Validation functions
export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password) => {
    return password.length >= 6;
  },

  ticketTitle: (title) => {
    return title.trim().length >= 5;
  },

  ticketDescription: (description) => {
    return description.trim().length >= 10;
  }
};
