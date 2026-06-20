export interface TicketAttachment {
  id: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  url?: string | null;
  createdAt?: string;
}

export interface Ticket {
  id: string;
  ticketNumber?: string;
  title?: string;
  status?: string;
  priority?: string;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  attachments?: TicketAttachment[];
  [key: string]: unknown;
}
