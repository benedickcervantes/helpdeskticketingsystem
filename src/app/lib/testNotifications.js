// Test file to debug admin notifications
import { createAdminTicketCreatedNotification } from './notificationUtils';

export const testAdminNotification = async () => {
  try {
    console.log('Testing admin notification creation...');
    
    const testTicketData = {
      id: 'test-ticket-123',
      title: 'Test Ticket',
      createdBy: 'test-user-123',
      priority: 'medium',
      category: 'software'
    };
    
    const testUserInfo = {
      name: 'Test User',
      email: 'test@example.com'
    };
    
    const notificationId = await createAdminTicketCreatedNotification(testTicketData, testUserInfo);
    console.log('Admin notification created successfully:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error creating test admin notification:', error);
    throw error;
  }
};
