'use client';

import { io, type Socket } from 'socket.io-client';
import { API_URL, getAccessToken } from '@/lib/api/client';
import {
  DEPARTMENT_CHANGED_EVENT,
  DESIGNATION_CHANGED_EVENT,
  NOTIFICATION_ALL_READ_EVENT,
  NOTIFICATION_NEW_EVENT,
  NOTIFICATION_READ_EVENT,
  TICKET_CREATED_EVENT,
  TICKET_MESSAGE_NEW_EVENT,
  TICKET_MESSAGES_READ_EVENT,
  TICKET_UPDATED_EVENT,
  USER_PROFILE_UPDATED_EVENT,
} from '@/lib/realtime/events';
import type { Notification } from '@/types/notification';
import type { Ticket, TicketMessage } from '@/types/ticket';
import type { UserProfile } from '@/types/user';

export type DepartmentRealtimeItem = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DesignationRealtimeItem = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

let socket: Socket | null = null;
let publicSocket: Socket | null = null;

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

/** Unauthenticated socket for public pages (Register department list). */
export function getPublicSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (publicSocket?.connected) return publicSocket;

  publicSocket = io(`${API_URL}/realtime`, {
    transports: ['websocket', 'polling'],
  });

  return publicSocket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function disconnectPublicSocket(): void {
  if (publicSocket) {
    publicSocket.disconnect();
    publicSocket = null;
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

export function subscribeTicketMessageEvents(
  onNew?: (payload: { ticketId?: string; message?: TicketMessage }) => void,
): () => void {
  const s = getSocket();
  if (!s) return () => {};

  const handleNew = (payload: { ticketId?: string; message?: TicketMessage }) =>
    onNew?.(payload);

  s.on(TICKET_MESSAGE_NEW_EVENT, handleNew);

  return () => {
    s.off(TICKET_MESSAGE_NEW_EVENT, handleNew);
  };
}

export function subscribeTicketMessagesReadEvents(
  onRead?: (payload: {
    ticketId?: string;
    userId?: string;
    lastReadAt?: string;
    role?: string;
  }) => void,
): () => void {
  const s = getSocket();
  if (!s) return () => {};

  const handleRead = (payload: {
    ticketId?: string;
    userId?: string;
    lastReadAt?: string;
    role?: string;
  }) => onRead?.(payload);

  s.on(TICKET_MESSAGES_READ_EVENT, handleRead);

  return () => {
    s.off(TICKET_MESSAGES_READ_EVENT, handleRead);
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

export function subscribeDepartmentEvents(
  onChanged?: (departments: DepartmentRealtimeItem[]) => void,
  options?: { publicOnly?: boolean },
): () => void {
  const s = options?.publicOnly ? getPublicSocket() : getSocket() || getPublicSocket();
  if (!s) return () => {};

  const handler = (payload: { departments?: DepartmentRealtimeItem[] }) => {
    onChanged?.(Array.isArray(payload?.departments) ? payload.departments : []);
  };

  s.on(DEPARTMENT_CHANGED_EVENT, handler);
  return () => {
    s.off(DEPARTMENT_CHANGED_EVENT, handler);
    if (options?.publicOnly) {
      // Keep public socket alive while Register is open; caller disconnects on unmount.
    }
  };
}

export function subscribeDesignationEvents(
  onChanged?: (designations: DesignationRealtimeItem[]) => void,
  options?: { publicOnly?: boolean },
): () => void {
  const s = options?.publicOnly ? getPublicSocket() : getSocket() || getPublicSocket();
  if (!s) return () => {};

  const handler = (payload: { designations?: DesignationRealtimeItem[] }) => {
    onChanged?.(Array.isArray(payload?.designations) ? payload.designations : []);
  };

  s.on(DESIGNATION_CHANGED_EVENT, handler);
  return () => {
    s.off(DESIGNATION_CHANGED_EVENT, handler);
  };
}
