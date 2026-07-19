// @ts-nocheck
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getTicketMessages,
  markTicketMessagesRead,
  postTicketMessage,
} from '@/lib/api/ticketMessages';
import {
  subscribeTicketMessageEvents,
  subscribeTicketMessagesReadEvents,
} from '@/lib/realtime/socketClient';
import type { TicketAttachment, TicketMessage } from '@/types/ticket';

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const MessageAvatar = ({ author, size = 'sm' }) => {
  const photoUrl = author?.photoUrl;
  const displayName = author?.name || author?.email || 'User';
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
  };
  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={displayName}
        className={`${sizeClass} rounded-full object-cover border border-app-subtle flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-app-on-primary font-semibold border border-app-subtle flex-shrink-0`}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
};

const formatMessageTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const isStaffRole = (role) =>
  role === 'ADMIN' || role === 'MANAGER' || role === 'admin' || role === 'manager';

const ReadReceipt = ({ seen }) => (
  <span
    className={`inline-flex items-center gap-0.5 text-[10px] sm:text-xs ${
      seen ? 'text-cyan-400' : 'text-app-muted'
    }`}
    title={seen ? 'Seen' : 'Sent'}
  >
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
    {seen && (
      <svg
        className="w-3.5 h-3.5 -ml-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    )}
    <span className="ml-0.5">{seen ? 'Seen' : 'Sent'}</span>
  </span>
);

export default function TicketConversation({
  ticketId,
  ticketStatus,
  createdBy,
  currentUserId,
  currentUserRole,
  onImageClick,
  scrollIntoViewOnMount = false,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [body, setBody] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const markReadInFlight = useRef(false);

  const isStaff = isStaffRole(currentUserRole);
  const canAccess =
    createdBy === currentUserId || isStaff;
  const canReply = canAccess && ticketStatus !== 'closed';

  const scrollToBottom = useCallback(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const applyReadReceipt = useCallback(
    (lastReadAt, readerUserId) => {
      if (!lastReadAt || readerUserId === currentUserId) return;
      const readTime = new Date(lastReadAt).getTime();

      setMessages((prev) =>
        prev.map((message) => {
          if (message.author?.id !== currentUserId) return message;
          const messageTime = new Date(message.createdAt).getTime();
          if (messageTime > readTime) return message;
          if (message.seen) return message;
          return { ...message, seen: true };
        }),
      );
    },
    [currentUserId],
  );

  const markAsRead = useCallback(async () => {
    if (!ticketId || !canAccess || markReadInFlight.current) return;

    markReadInFlight.current = true;
    try {
      await markTicketMessagesRead(ticketId);
    } catch {
      /* ignore — will retry on next load */
    } finally {
      markReadInFlight.current = false;
    }
  }, [ticketId, canAccess]);

  const loadMessages = useCallback(async () => {
    if (!ticketId || !canAccess) {
      setLoading(false);
      if (!canAccess) setAccessDenied(true);
      return;
    }

    setLoading(true);
    setError('');
    setAccessDenied(false);

    try {
      const data = await getTicketMessages(ticketId);
      setMessages(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load conversation';
      if (msg.toLowerCase().includes('access') || msg.includes('403')) {
        setAccessDenied(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [ticketId, canAccess]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (scrollIntoViewOnMount) {
      setTimeout(() => {
        document
          .getElementById('ticket-conversation')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, [scrollIntoViewOnMount, ticketId]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages.length, scrollToBottom]);

  useEffect(() => {
    if (!ticketId) return;

    const unsubscribe = subscribeTicketMessageEvents((payload) => {
      if (payload?.ticketId !== ticketId || !payload?.message) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        return [...prev, payload.message];
      });

      if (payload.message.author?.id !== currentUserId) {
        void markAsRead();
      }
    });

    return unsubscribe;
  }, [ticketId, currentUserId, markAsRead]);

  useEffect(() => {
    if (!ticketId) return;

    const unsubscribe = subscribeTicketMessagesReadEvents((payload) => {
      if (payload?.ticketId !== ticketId) return;
      applyReadReceipt(payload.lastReadAt, payload.userId);
    });

    return unsubscribe;
  }, [ticketId, applyReadReceipt]);

  useEffect(() => {
    return () => {
      attachmentPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachmentPreviews]);

  const resetAttachments = () => {
    attachmentPreviews.forEach((url) => URL.revokeObjectURL(url));
    setAttachmentFiles([]);
    setAttachmentPreviews([]);
    setAttachmentError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setAttachmentError('');

    if (attachmentFiles.length + files.length > MAX_ATTACHMENTS) {
      setAttachmentError(`Maximum ${MAX_ATTACHMENTS} photos per message`);
      return;
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setAttachmentError('Only JPEG, PNG, WEBP, and GIF images are allowed');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setAttachmentError('Each image must be 5MB or smaller');
        return;
      }
    }

    setAttachmentFiles((prev) => [...prev, ...files]);
    setAttachmentPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeAttachment = (index) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentPreviews((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed);
      return prev.filter((_, i) => i !== index);
    });
    setAttachmentError('');
  };

  const canSend = body.trim().length > 0 || attachmentFiles.length > 0;

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!canSend || sending || !canReply) return;

    setSending(true);
    setError('');

    try {
      const newMessage = await postTicketMessage(
        ticketId,
        trimmed,
        attachmentFiles,
      );
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, { ...newMessage, seen: false }];
      });
      setBody('');
      resetAttachments();
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (accessDenied) {
    return (
      <div className="app-card rounded-lg sm:rounded-xl p-4 sm:p-6 border">
        <p className="text-sm text-app-muted text-center">
          Only the ticket creator and IT support can view this conversation.
        </p>
      </div>
    );
  }

  return (
    <div
      id="ticket-conversation"
      className="app-card rounded-lg sm:rounded-xl border overflow-hidden"
    >
      <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-app-subtle">
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h4 className="text-base sm:text-lg font-semibold text-app">
          Conversation
        </h4>
        {messages.length > 0 && (
          <span className="text-xs text-app-muted ml-auto">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </span>
        )}
      </div>

      <div className="p-3 sm:p-4 max-h-80 sm:max-h-96 overflow-y-auto space-y-3 sm:space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-8 h-8 rounded-full bg-app-surface-2/80" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-app-surface-2/80 rounded w-1/4" />
                  <div className="h-4 bg-app-surface-2/80 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error && messages.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-red-400 mb-2">{error}</p>
            <button
              type="button"
              onClick={loadMessages}
              className="text-sm text-cyan-400 hover:text-cyan-300"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-app-muted text-center py-6">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          messages.map((message) => {
            const isOwn = message.author?.id === currentUserId;
            const authorIsStaff = isStaffRole(message.author?.role);

            return (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                <MessageAvatar author={message.author} />
                <div
                  className={`flex-1 min-w-0 max-w-[85%] sm:max-w-[75%] ${isOwn ? 'text-right' : ''}`}
                >
                  <div
                    className={`flex items-center gap-2 mb-1 flex-wrap ${isOwn ? 'justify-end' : ''}`}
                  >
                    <span className="text-xs sm:text-sm font-medium text-app-soft">
                      {message.author?.name || message.author?.email}
                    </span>
                    {authorIsStaff && (
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        IT Support
                      </span>
                    )}
                    <span className="text-[10px] sm:text-xs text-app-muted">
                      {formatMessageTime(message.createdAt)}
                    </span>
                  </div>
                  {message.body?.trim() && (
                    <div
                      className={`inline-block text-left rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 ${
                        isOwn
                          ? 'bg-app-primary-soft border border-app-primary/30 text-app'
                          : 'bg-app-surface-2/60 border border-app-subtle text-app-soft'
                      }`}
                    >
                      <p className="text-sm sm:text-base whitespace-pre-wrap break-words">
                        {message.body}
                      </p>
                    </div>
                  )}
                  {message.attachments?.length > 0 && (
                    <div
                      className={`${message.body?.trim() ? 'mt-2' : ''} flex flex-wrap gap-2 ${
                        isOwn ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.attachments.map((attachment) => (
                        <button
                          key={attachment.id}
                          type="button"
                          onClick={() => onImageClick?.(attachment)}
                          className="group relative rounded-lg overflow-hidden border border-app-subtle bg-app-surface-2/80 aspect-square w-20 sm:w-24 hover:border-purple-500/50 transition-colors"
                        >
                          {attachment.url ? (
                            <img
                              src={attachment.url}
                              alt={attachment.fileName || 'Attachment'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-app-muted text-[10px] px-1">
                              Unavailable
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {isOwn && (
                    <div className={`mt-1 ${isOwn ? 'text-right' : ''}`}>
                      <ReadReceipt seen={!!message.seen} />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={threadEndRef} />
      </div>

      {canReply ? (
        <div className="p-3 sm:p-4 border-t border-app-subtle space-y-3">
          {error && messages.length > 0 && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          {attachmentPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachmentPreviews.map((preview, index) => (
                <div key={preview} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg border border-app-subtle"
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full text-white text-xs flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {attachmentError && (
            <p className="text-xs text-red-400">{attachmentError}</p>
          )}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={sending}
            className="app-field w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none resize-none disabled:opacity-50"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleFileSelect}
                disabled={sending || attachmentFiles.length >= MAX_ATTACHMENTS}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || attachmentFiles.length >= MAX_ATTACHMENTS}
                className="px-3 py-2 text-xs sm:text-sm text-app-soft hover:text-app bg-app-surface-2/80 hover:bg-app-surface-3 rounded-lg border border-app-subtle transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Attach
              </button>
              <span className="text-[10px] text-app-muted hidden sm:inline">
                Up to {MAX_ATTACHMENTS} photos, 5MB each
              </span>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !canSend}
              className="px-4 py-2 bg-app-primary hover:opacity-90 text-app-on-primary rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {sending ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  Send
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      ) : ticketStatus === 'closed' && canAccess ? (
        <div className="p-3 sm:p-4 border-t border-app-subtle">
          <p className="text-xs sm:text-sm text-app-muted text-center">
            This ticket is closed. No new messages can be posted.
          </p>
        </div>
      ) : null}
    </div>
  );
}
