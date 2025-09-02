// src/app/utils/firestore.js
import { db } from '../firebaseconfig';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const fetchUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const fetchTickets = async (userEmail, isAdmin) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'tickets'));
    const allTickets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return isAdmin 
      ? allTickets 
      : allTickets.filter(ticket => ticket.createdBy === userEmail);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
};

export const createTicket = async (ticketData) => {
  try {
    const docRef = await addDoc(collection(db, 'tickets'), ticketData);
    return { id: docRef.id, ...ticketData };
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
};

export const updateTicket = async (ticketId, updates) => {
  try {
    await updateDoc(doc(db, 'tickets', ticketId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    throw error;
  }
};

export const deleteTicket = async (ticketId) => {
  try {
    await deleteDoc(doc(db, 'tickets', ticketId));
  } catch (error) {
    console.error('Error deleting ticket:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, 'users'), userData);
    return { id: docRef.id, ...userData };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId, updates) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};