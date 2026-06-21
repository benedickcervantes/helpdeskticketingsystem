'use client';

import { io, type Socket } from 'socket.io-client';
import { API_URL, getAccessToken } from '@/lib/api/client';
import {
  NOTIFICATION_ALL_READ_EVENT,
  NOTIFICATION_NEW_EVENT,
  NOTIFICATION_READ_EVENT,
  TICKET_CREATED_EVENT,
  TICKET_UPDATED_EVENT,
  USER_PROFILE_UPDATED_EVENT,
} from '@/lib/realtime/events';
import type { Notification } from '@/types/notification';
import type { Ticket } from '@/types/ticket';
import type { UserProfile } from '@/types/user';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  const token = getAccessToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket?.connected) return socket;

  socket = io(`${API_URL}/realtime`, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeTicketEvents(
  onCreated?: (ticket: Ticket | undefined) => void,
  onUpdated?: (ticket: Ticket | undefined) => void,
): () => void {
  const s = getSocket();
  if (!s) return () => {};

  const handleCreated = (payload: { ticket?: Ticket }) =>
    onCreated?.(payload?.ticket);
  const handleUpdated = (payload: { ticket?: Ticket }) =>
    onUpdated?.(payload?.ticket);

  s.on(TICKET_CREATED_EVENT, handleCreated);
  s.on(TICKET_UPDATED_EVENT, handleUpdated);

  return () => {
    s.off(TICKET_CREATED_EVENT, handleCreated);
    s.off(TICKET_UPDATED_EVENT, handleUpdated);
  };
}

export function subscribeNotificationEvents(
  onNew?: (notification: Notification | undefined) => void,
  onRead?: (payload: { notificationId?: string; adminNotification?: boolean }) => void,
  onAllRead?: (payload: { adminNotification?: boolean }) => void,
): () => void {
  const s = getSocket();
  if (!s) return () => {};

  const handleNew = (payload: { notification?: Notification }) =>
    onNew?.(payload?.notification);
  const handleRead = (payload: {
    notificationId?: string;
    adminNotification?: boolean;
  }) => onRead?.(payload);
  const handleAllRead = (payload: { adminNotification?: boolean }) =>
    onAllRead?.(payload);

  s.on(NOTIFICATION_NEW_EVENT, handleNew);
  s.on(NOTIFICATION_READ_EVENT, handleRead);
  s.on(NOTIFICATION_ALL_READ_EVENT, handleAllRead);

  return () => {
    s.off(NOTIFICATION_NEW_EVENT, handleNew);
    s.off(NOTIFICATION_READ_EVENT, handleRead);
    s.off(NOTIFICATION_ALL_READ_EVENT, handleAllRead);
  };
}

export function subscribeUserProfileEvents(
  onUpdated?: (user: UserProfile | undefined) => void,
): () => void {
  const s = getSocket();
  if (!s) return () => {};

  const handler = (payload: { user?: UserProfile }) => onUpdated?.(payload?.user);
  s.on(USER_PROFILE_UPDATED_EVENT, handler);
  return () => s.off(USER_PROFILE_UPDATED_EVENT, handler);
}
