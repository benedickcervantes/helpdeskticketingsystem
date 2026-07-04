import { api, apiFetch } from '@/lib/api/client';
import type { TicketMessage } from '@/types/ticket';

export async function getTicketMessages(
  ticketId: string,
): Promise<TicketMessage[]> {
  const result = await api.get<TicketMessage[]>(
    `/api/v1/tickets/${ticketId}/messages`,
  );
  return result ?? [];
}

export async function postTicketMessage(
  ticketId: string,
  body: string,
  files: File[] = [],
): Promise<TicketMessage> {
  const form = new FormData();
  form.append('body', body.trim());
  files.forEach((file) => form.append('files', file));

  const result = await apiFetch<TicketMessage>(
    `/api/v1/tickets/${ticketId}/messages`,
    { method: 'POST', body: form },
  );

  if (!result) {
    throw new Error('Failed to send message');
  }

  return result;
}

export async function markTicketMessagesRead(
  ticketId: string,
): Promise<{ ticketId: string; userId: string; lastReadAt: string }> {
  const result = await api.post<{
    ticketId: string;
    userId: string;
    lastReadAt: string;
  }>(`/api/v1/tickets/${ticketId}/messages/read`, {});

  if (!result) {
    throw new Error('Failed to mark messages as read');
  }

  return result;
}
