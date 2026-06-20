export interface Notification {
  id: string;
  title?: string;
  message?: string;
  read?: boolean;
  adminNotification?: boolean;
  createdAt?: string | Date;
  [key: string]: unknown;
}
