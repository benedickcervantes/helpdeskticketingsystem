/** Notification types that should open the ticket detail / conversation */
export const TICKET_LINK_NOTIFICATION_TYPES = [
  'ticket_message',
  'new_ticket_created',
  'ticket_status_changed',
  'ticket_resolved',
  'ticket_assigned',
] as const;

export type TicketLinkNotificationType =
  (typeof TICKET_LINK_NOTIFICATION_TYPES)[number];

export function isTicketLinkNotification(
  type: string | undefined,
  ticketId: string | undefined | null,
): ticketId is string {
  if (!ticketId) return false;
  return TICKET_LINK_NOTIFICATION_TYPES.includes(
    type as TicketLinkNotificationType,
  );
}

export function buildTicketDashboardUrl(
  role: string | null | undefined,
  ticketId: string,
  options?: { focusConversation?: boolean; openKey?: string | number },
): string {
  const params = new URLSearchParams({
    tab: 'tickets',
    ticket: ticketId,
  });

  if (options?.focusConversation) {
    params.set('focus', 'conversation');
  }

  if (options?.openKey != null) {
    params.set('open', String(options.openKey));
  }

  if (role === 'admin') return `/admin?${params.toString()}`;
  if (role === 'manager') return `/management?${params.toString()}`;
  return `/user?${params.toString()}`;
}

/** Strip deep-link params after the ticket modal opens or closes. */
export function buildUrlWithoutTicketParams(
  pathname: string,
  searchParams: URLSearchParams | { toString(): string },
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('ticket');
  params.delete('focus');
  params.delete('open');
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
