import { api } from '@/lib/api/client';

export type SimilarTicket = {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  category: string;
  department: string | null;
};

export type TriageSuggestion = {
  category: string;
  priority: string;
  reason: string;
  similarTickets: SimilarTicket[];
  source: 'model' | 'keywords';
};

export type ReplyDraft = {
  draft: string;
  source: 'model' | 'keywords';
};

export type ThreadSummary = {
  problem: string;
  tried: string;
  waitingOn: string;
  source: 'model' | 'keywords';
};

export function suggestTicket(title: string, description: string) {
  return api.post<TriageSuggestion>('/api/v1/ai/triage', { title, description });
}

export function draftTicketReply(ticketId: string) {
  return api.post<ReplyDraft>(`/api/v1/ai/tickets/${ticketId}/reply-draft`, {});
}

export function summarizeTicket(ticketId: string) {
  return api.post<ThreadSummary>(`/api/v1/ai/tickets/${ticketId}/summary`, {});
}

export type HelpChatResult = {
  reply: string;
  answered: boolean;
  source: 'faq' | 'ticket' | 'handoff' | 'guide' | 'model';
  topic: string | null;
  suggestManualTicket: boolean;
  offerTicket: boolean;
  ticket: { id: string; ticketNumber: string } | null;
};

export function askHelp(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ticketId?: string,
  images?: Array<{ mimeType: string; data: string }>,
  files?: Array<{ name: string; mimeType: string; data: string }>,
  model?: string,
) {
  return api.post<HelpChatResult>('/api/v1/ai/chat', {
    messages: messages.slice(-12).map((message) => ({
      role: message.role,
      content: message.content.slice(0, 2000),
    })),
    ticketId,
    images,
    files,
    model,
  });
}
