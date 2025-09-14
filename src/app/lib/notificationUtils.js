import { db } from '../firebaseconfig';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Notification types
export const NOTIFICATION_TYPES = {
  TICKET_RESOLVED: 'ticket_resolved',
  TICKET_UPDATED: 'ticket_updated',
  TICKET_STATUS_CHANGED: 'ticket_status_changed',
  FEEDBACK_REQUESTED: 'feedback_requested'
};

// Create a notification
export const createNotification = async (notificationData) => {
  try {
    const notification = {
      ...notificationData,
      createdAt: new Date(),
      read: false
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create ticket resolution notification
export const createTicketResolutionNotification = async (ticketData, resolvedBy) => {
  try {
    const notification = {
      type: NOTIFICATION_TYPES.TICKET_RESOLVED,
      title: 'Ticket Resolved',
      message: `Your ticket "${ticketData.title}" has been resolved by the IT team.`,
      userId: ticketData.createdBy,
      ticketId: ticketData.id,
      resolvedBy: resolvedBy,
      priority: ticketData.priority,
      category: ticketData.category,
      createdAt: new Date(),
      read: false
    };
    
    const notificationId = await createNotification(notification);
    
    // Create automatic feedback request notification after a short delay
    setTimeout(async () => {
      try {
        await createFeedbackRequestNotification(ticketData);
      } catch (error) {
        console.error('Error creating feedback request notification:', error);
      }
    }, 30000); // 30 second delay for feedback request
    
    return notificationId;
  } catch (error) {
    console.error('Error creating ticket resolution notification:', error);
    throw error;
  }
};

// MISSING FUNCTION - Create user ticket resolution notification (called from TicketList.jsx)
export const createUserTicketResolutionNotification = async (ticketData, resolvedBy) => {
  try {
    return await createTicketResolutionNotification(ticketData, resolvedBy);
  } catch (error) {
    console.error('Error creating user ticket resolution notification:', error);
    throw error;
  }
};

// MISSING FUNCTION - Create user ticket status change notification (called from TicketList.jsx)
export const createUserTicketStatusChangeNotification = async (ticketData, newStatus, changedBy) => {
  try {
    const statusMessages = {
      'open': 'Your ticket has been reopened and is awaiting review.',
      'in-progress': 'Your ticket is now being worked on by the IT team.',
      'resolved': 'Your ticket has been resolved.',
      'closed': 'Your ticket has been closed.'
    };

    const notification = {
      type: NOTIFICATION_TYPES.TICKET_STATUS_CHANGED,
      title: 'Ticket Status Updated',
      message: `Your ticket "${ticketData.title}" status changed to "${newStatus}". ${statusMessages[newStatus] || ''}`,
      userId: ticketData.createdBy,
      ticketId: ticketData.id,
      newStatus: newStatus,
      changedBy: changedBy,
      priority: ticketData.priority,
      category: ticketData.category,
      createdAt: new Date(),
      read: false
    };
    
    return await createNotification(notification);
  } catch (error) {
    console.error('Error creating user ticket status change notification:', error);
    throw error;
  }
};

// Create feedback request notification
export const createFeedbackRequestNotification = async (ticketData) => {
  try {
    const notification = {
      type: NOTIFICATION_TYPES.FEEDBACK_REQUESTED,
      title: 'Feedback Requested',
      message: `Please provide feedback on your resolved ticket "${ticketData.title}" to help us improve our IT services.`,
      userId: ticketData.createdBy,
      ticketId: ticketData.id,
      createdAt: new Date(),
      read: false
    };
    
    return await createNotification(notification);
  } catch (error) {
    console.error('Error creating feedback request notification:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Get user notifications (FIXED: removed incorrect userNotification filter)
export const getUserNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, callback);
};

// Get unread notification count (FIXED: removed incorrect userNotification filter)
export const getUnreadNotificationCount = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  return onSnapshot(q, callback);
};

// Automatic ticket resolution system
export const autoResolveTicket = async (ticketId, resolvedBy = 'system') => {
  try {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../firebaseconfig');
    
    // Update ticket status to resolved
    await updateDoc(doc(db, 'tickets', ticketId), {
      status: 'resolved',
      resolvedBy: resolvedBy,
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      autoResolved: true
    });

    // Get the updated ticket data for notifications
    const { getDoc } = await import('firebase/firestore');
    const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
    
    if (ticketDoc.exists()) {
      const ticketData = { id: ticketDoc.id, ...ticketDoc.data() };
      
      // Create resolution notification
      await createTicketResolutionNotification(ticketData, resolvedBy);
      
      return ticketData;
    }
  } catch (error) {
    console.error('Error auto-resolving ticket:', error);
    throw error;
  }
};

// Auto-resolve tickets based on criteria (e.g., age, category, etc.)
export const autoResolveEligibleTickets = async () => {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebaseconfig');
    
    // Get tickets that are eligible for auto-resolution
    // Criteria: open status, older than 7 days, low/medium priority
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    // Remove orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'tickets'),
      where('status', '==', 'open'),
      where('priority', 'in', ['low', 'medium']),
      where('createdAt', '<=', sevenDaysAgo)
    );
    
    const snapshot = await getDocs(q);
    let ticketsToResolve = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort client-side by createdAt to avoid composite index
    ticketsToResolve.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return aTime - bTime; // Ascending order (oldest first)
    });
    
    console.log(`Found ${ticketsToResolve.length} tickets eligible for auto-resolution`);
    
    // Auto-resolve each eligible ticket
    const results = await Promise.allSettled(
      ticketsToResolve.map(ticket => autoResolveTicket(ticket.id, 'auto-resolve-system'))
    );
    
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    console.log(`Auto-resolution completed: ${successful} successful, ${failed} failed`);
    
    return {
      total: ticketsToResolve.length,
      successful,
      failed,
      tickets: ticketsToResolve
    };
  } catch (error) {
    console.error('Error in auto-resolve eligible tickets:', error);
    throw error;
  }
};

// Create auto-resolution notification
export const createAutoResolutionNotification = async (ticketData) => {
  try {
    const notification = {
      type: NOTIFICATION_TYPES.TICKET_RESOLVED,
      title: 'Ticket Auto-Resolved',
      message: `Your ticket "${ticketData.title}" has been automatically resolved by our system after 7 days. If you still need assistance, please create a new ticket.`,
      userId: ticketData.createdBy,
      ticketId: ticketData.id,
      resolvedBy: 'auto-resolve-system',
      priority: ticketData.priority,
      category: ticketData.category,
      autoResolved: true,
      createdAt: new Date(),
      read: false
    };
    
    return await createNotification(notification);
  } catch (error) {
    console.error('Error creating auto-resolution notification:', error);
    throw error;
  }
};

// Feedback tracking functions
export const checkFeedbackExists = async (ticketId, userId) => {
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebaseconfig');
    
    const q = query(
      collection(db, 'feedback'),
      where('ticketId', '==', ticketId),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking feedback existence:', error);
    return false;
  }
};

export const markFeedbackAsSubmitted = async (ticketId, userId) => {
  try {
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../firebaseconfig');
    
    // Update the ticket to mark feedback as submitted
    await updateDoc(doc(db, 'tickets', ticketId), {
      feedbackSubmitted: true,
      feedbackSubmittedBy: userId,
      feedbackSubmittedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking feedback as submitted:', error);
    throw error;
  }
};

export const getTicketFeedbackStatus = async (ticketId, userId) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('../firebaseconfig');
    
    const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
    if (ticketDoc.exists()) {
      const ticketData = ticketDoc.data();
      return {
        feedbackSubmitted: ticketData.feedbackSubmitted || false,
        feedbackSubmittedBy: ticketData.feedbackSubmittedBy,
        feedbackSubmittedAt: ticketData.feedbackSubmittedAt
      };
    }
    return { feedbackSubmitted: false };
  } catch (error) {
    console.error('Error getting ticket feedback status:', error);
    return { feedbackSubmitted: false };
  }
};

// Admin notification functions
export const createAdminTicketCreatedNotification = async (ticketData, userInfo) => {
  try {
    const notification = {
      type: 'new_ticket_created',
      title: 'New Ticket Created',
      message: `User ${userInfo.name || userInfo.email} created a new ticket: "${ticketData.title}"`,
      adminNotification: true,
      ticketId: ticketData.id,
      userId: ticketData.createdBy,
      priority: ticketData.priority,
      category: ticketData.category,
      createdAt: new Date(),
      read: false
    };
    
    return await createNotification(notification);
  } catch (error) {
    console.error('Error creating admin ticket created notification:', error);
    throw error;
  }
};

export const createAdminFeedbackSubmittedNotification = async (feedbackData, userInfo, ticketInfo) => {
  try {
    const notification = {
      type: 'feedback_submitted',
      title: 'Feedback Submitted',
      message: `User ${userInfo.name || userInfo.email} submitted feedback for ticket: "${ticketInfo.title}" (Rating: ${feedbackData.rating}/5)`,
      adminNotification: true,
      ticketId: feedbackData.ticketId,
      userId: feedbackData.userId,
      feedbackId: feedbackData.id,
      rating: feedbackData.rating,
      createdAt: new Date(),
      read: false
    };
    
    return await createNotification(notification);
  } catch (error) {
    console.error('Error creating admin feedback submitted notification:', error);
    throw error;
  }
};

// Get admin notifications
export const getAdminNotifications = (callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('adminNotification', '==', true)
  );
  
  return onSnapshot(q, callback);
};

// Get unread admin notification count
export const getUnreadAdminNotificationCount = (callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('adminNotification', '==', true),
    where('read', '==', false)
  );
  
  return onSnapshot(q, callback);
};

// FIXED: Get unread user notification count (removed incorrect userNotification filter)
export const getUnreadUserNotificationCount = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  
  return onSnapshot(q, callback);
};

// Alias for backward compatibility
export const createAdminNewTicketNotification = createAdminTicketCreatedNotification;
