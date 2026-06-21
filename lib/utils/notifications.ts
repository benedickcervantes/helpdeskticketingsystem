import { api } from '@/lib/api/client';
import { subscribeNotificationEvents } from '@/lib/realtime/socketClient';
import type { Notification } from '@/types/notification';

const localChangeListeners = new Set<() => void>();

function notifyLocalNotificationChange(): void {
  localChangeListeners.forEach((listener) => listener());
}

export function subscribeNotificationChanges(listener: () => void): () => void {
  localChangeListeners.add(listener);
  return () => {
    localChangeListeners.delete(listener);
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  return (await api.get<Notification[]>('/api/v1/notifications')) ?? [];
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  await api.patch(`/api/v1/notifications/${notificationId}/read`, {});
  notifyLocalNotificationChange();
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.post('/api/v1/notifications/read-all', {});
  notifyLocalNotificationChange();
}

export async function getUnreadUserNotificationCount(
  userId?: string,
): Promise<number> {
  void userId;
  try {
    const notifications = await fetchNotifications();
    return notifications.filter((n) => !n.read && !n.adminNotification).length;
  } catch {
    return 0;
  }
}

export async function getUnreadAdminNotificationCount(): Promise<number> {
  try {
    const notifications = await fetchNotifications();
    return notifications.filter((n) => !n.read && n.adminNotification).length;
  } catch {
    return 0;
  }
}

export function subscribeNotifications(
  callback: (notification: Notification | undefined) => void,
): () => void {
  const refresh = () => callback(undefined);
  const unsubSocket = subscribeNotificationEvents(
    (notification) => callback(notification),
    refresh,
    refresh,
  );
  const unsubLocal = subscribeNotificationChanges(refresh);
  return () => {
    unsubSocket();
    unsubLocal();
  };
}

export function getAdminNotifications(
  callback: (notifications: Notification[]) => void,
): () => void {
  let active = true;

  const load = async () => {
    try {
      const data = await fetchNotifications();
      if (active) callback(data);
    } catch (err) {
      console.error('Failed to load admin notifications', err);
    }
  };

  load();
  const unsub = subscribeNotifications(() => {
    void load();
  });

  return () => {
    active = false;
    unsub();
  };
}

export function getUserNotifications(
  userId: string | undefined,
  callback: (notifications: Notification[]) => void,
): () => void {
  void userId;
  let active = true;

  const load = async () => {
    try {
      const data = await fetchNotifications();
      const userItems = data.filter((n) => !n.adminNotification);
      if (active) callback(userItems);
    } catch (err) {
      console.error('Failed to load user notifications', err);
    }
  };

  load();
  const unsub = subscribeNotifications(() => {
    void load();
  });

  return () => {
    active = false;
    unsub();
  };
}

export async function getTicketFeedbackStatus(ticketId: string): Promise<boolean> {
  try {
    const ticket = await api.get<{ feedbackSubmitted?: boolean }>(
      `/api/v1/tickets/${ticketId}`,
    );
    return ticket?.feedbackSubmitted ?? false;
  } catch {
    return false;
  }
}

export async function checkFeedbackExists(ticketId: string): Promise<boolean> {
  return getTicketFeedbackStatus(ticketId);
}
