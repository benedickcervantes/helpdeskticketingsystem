export interface TicketAttachment {
  id: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  url?: string | null;
  createdAt?: string;
}

export interface TicketMessageAuthor {
  id: string;
  name: string;
  email: string;
  role?: string;
  photoUrl?: string | null;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  body: string;
  createdAt: string;
  author: TicketMessageAuthor;
  attachments: TicketAttachment[];
  /** Present on own messages: true when the other party has read up to this message */
  seen?: boolean;
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
