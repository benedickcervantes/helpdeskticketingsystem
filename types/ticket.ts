export interface Ticket {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
}
