'use client';

import { useEffect, useState } from 'react';
import { askHelp } from '@/lib/api/ai';
import { apiFetch } from '@/lib/api/client';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  topic?: string | null;
  suggestManualTicket?: boolean;
  offerTicket?: boolean;
};

const IDEAS = [
  { label: 'Wi-Fi', prompt: 'Hindi maka-connect sa Wi-Fi ang laptop ko.' },
  { label: 'Password', prompt: 'Naka-lock ang account ko at kailangan ng password reset.' },
  { label: 'Printer', prompt: 'Paper jam sa printer sa isang PC.' },
  { label: 'Email', prompt: 'I cannot open my email.' },
  { label: 'Desktop', prompt: 'My desktop computer will not turn on.' },
  { label: 'VPN', prompt: 'Hindi maka-connect sa VPN.' },
  { label: 'Internet', prompt: 'Buong office walang internet.' },
  { label: 'Monitor', prompt: 'Walang display ang monitor.' },
  { label: 'Excel', prompt: 'Excel keeps crashing.' },
  { label: 'SAP', prompt: 'SAP license expired.' },
  { label: 'Phishing', prompt: 'May phishing email sa inbox.' },
  { label: 'Laptop', prompt: 'My laptop will not turn on.' },
  { label: 'Software', prompt: 'A program on my computer will not open.' },
  { label: 'Server', prompt: 'I cannot connect to the office server.' },
];

const MODELS = [
  { id: 'auto', label: 'Auto' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
];

const DEFAULT_MODEL = 'auto';

const STARTER: ChatMessage = {
  role: 'assistant',
  content:
    'How can we help? Ask any question and the assistant will reply.',
};

function threadKey(userId: string) {
  return `ask-it-thread:${userId}`;
}

function readThread(userId: string): { messages: ChatMessage[]; ticket: { id: string; ticketNumber: string } | null } | null {
  try {
    const raw = window.localStorage.getItem(threadKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { messages?: unknown; ticket?: unknown };
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.filter((item): item is ChatMessage => {
          if (!item || typeof item !== 'object') return false;
          const message = item as ChatMessage;
          return (
            (message.role === 'user' || message.role === 'assistant') &&
            typeof message.content === 'string' &&
            message.content.trim().length > 0 &&
            message.content.length <= 4000
          );
        }).slice(-30)
      : [];
    const ticketRecord = parsed.ticket as { id?: unknown; ticketNumber?: unknown } | null;
    const ticket =
      ticketRecord &&
      typeof ticketRecord.id === 'string' &&
      typeof ticketRecord.ticketNumber === 'string'
        ? { id: ticketRecord.id, ticketNumber: ticketRecord.ticketNumber }
        : null;
    if (!messages.length) return null;
    return { messages, ticket };
  } catch {
    return null;
  }
}

export default function HelpChat({
  userId,
  onOpenTickets,
  onCreateTicket,
  onClose,
  floating = false,
}: {
  userId?: string;
  onOpenTickets?: () => void;
  onCreateTicket?: () => void;
  onClose?: () => void;
  floating?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([STARTER]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<{ id: string; ticketNumber: string } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [docs, setDocs] = useState<File[]>([]);
  const [analyzePhotos, setAnalyzePhotos] = useState(false);
  const [analyzeDocs, setAnalyzeDocs] = useState(false);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [error, setError] = useState('');
  const [threadReady, setThreadReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('ask-it-model');
    if (saved && MODELS.some((item) => item.id === saved)) setModel(saved);
  }, []);

  useEffect(() => {
    if (!userId) {
      setThreadReady(false);
      return;
    }
    const saved = readThread(userId);
    setMessages(saved?.messages ?? [STARTER]);
    setTicket(saved?.ticket ?? null);
    setDraft('');
    setPhotos([]);
    setDocs([]);
    setAnalyzePhotos(false);
    setAnalyzeDocs(false);
    setError('');
    setThreadReady(true);
  }, [userId]);

  useEffect(() => {
    if (!userId || !threadReady) return;
    const kept = messages.filter((message) => message !== STARTER).slice(-30);
    if (!kept.length) {
      window.localStorage.removeItem(threadKey(userId));
      return;
    }
    window.localStorage.setItem(
      threadKey(userId),
      JSON.stringify({ messages: kept, ticket }),
    );
  }, [messages, ticket, threadReady, userId]);

  const newChat = () => {
    setMessages([STARTER]);
    setDraft('');
    setTicket(null);
    setPhotos([]);
    setDocs([]);
    setAnalyzePhotos(false);
    setAnalyzeDocs(false);
    setError('');
    if (userId) window.localStorage.removeItem(threadKey(userId));
  };

  const send = async (text?: string) => {
    const typed = (text ?? draft).trim();
    const photoFiles = analyzePhotos ? photos.slice() : [];
    const docFiles = analyzeDocs ? docs.slice() : [];
    const content = typed || (photoFiles.length || docFiles.length ? 'Please read the attached file.' : '');
    if (!content || sending) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setDraft('');
    setAnalyzePhotos(false);
    setAnalyzeDocs(false);
    setReadingPhoto(photoFiles.length + docFiles.length > 0);
    setSending(true);
    setError('');
    try {
      const images = await Promise.all(photoFiles.map(shrinkPhoto));
      const files = await Promise.all(docFiles.map(fileToChatFile));
      const result = await askHelp(
        next.filter((message) => message !== STARTER).slice(-12),
        ticket?.id,
        images,
        files,
        model,
      );
      if (!result?.reply) throw new Error('No reply');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.reply,
          topic: result.topic,
          suggestManualTicket: result.suggestManualTicket,
          offerTicket: result.offerTicket,
        },
      ]);
      if (result.ticket) {
        setTicket(result.ticket);
        if (photos.length || docs.length) {
          const form = new FormData();
          [...photos, ...docs].forEach((file) => form.append('files', typedFile(file)));
          await apiFetch(`/api/v1/tickets/${result.ticket.id}/attachments`, {
            method: 'POST',
            body: form,
          });
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Na-attach na ang file sa ticket.' },
          ]);
          setPhotos([]);
          setDocs([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach Ask IT.');
    } finally {
      setSending(false);
      setReadingPhoto(false);
    }
  };

  const addFiles = (selected: File[]) => {
    const nextPhotos = [...photos];
    const nextDocs = [...docs];
    const skipped: string[] = [];
    let addedPhoto = false;
    let addedDoc = false;
    for (const file of selected) {
      if (nextPhotos.length + nextDocs.length >= 3) {
        skipped.push('You can attach up to 3 files.');
        break;
      }
      if (isImageFile(file)) {
        if (file.size > 5 * 1024 * 1024) {
          skipped.push(`${file.name} is over 5 MB.`);
          continue;
        }
        nextPhotos.push(file);
        addedPhoto = true;
      } else if (documentMime(file)) {
        if (file.size > 2 * 1024 * 1024) {
          skipped.push(`${file.name} must be 2 MB or smaller so it can be read.`);
          continue;
        }
        if (nextDocs.length >= 2) {
          skipped.push('You can attach up to 2 documents.');
          continue;
        }
        nextDocs.push(file);
        addedDoc = true;
      } else {
        skipped.push(`${file.name} needs to be a photo, PDF, DOCX, XLSX, PPTX, TXT, or CSV.`);
      }
    }
    setPhotos(nextPhotos.slice(0, 3));
    setDocs(nextDocs.slice(0, 2));
    if (addedPhoto) setAnalyzePhotos(true);
    if (addedDoc) setAnalyzeDocs(true);
    setError(skipped.join(' '));
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => {
      const next = current.filter((_, item) => item !== index);
      if (!next.length) setAnalyzePhotos(false);
      return next;
    });
  };

  const removeDoc = (index: number) => {
    setDocs((current) => {
      const next = current.filter((_, item) => item !== index);
      if (!next.length) setAnalyzeDocs(false);
      return next;
    });
  };

  const started = messages.some((message) => message.role === 'user');
  const visible = messages.filter((message) => message !== STARTER);

  return (
    <div className={floating ? 'flex h-full min-h-0 w-full' : 'max-w-3xl mx-auto'}>
      <div className={`flex w-full flex-col overflow-hidden rounded-3xl border border-app bg-app-panel shadow-sm ${floating ? 'h-full min-h-0' : 'min-h-[36rem]'}`}>
        <div className={`flex items-start gap-2 border-b border-app-subtle sm:gap-3 ${floating ? 'px-3 py-3' : 'px-5 py-4'}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-app-primary-soft text-app-primary">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.2l1.15 4.55c.22.86.9 1.54 1.76 1.76L19.5 9.7l-4.59 1.19a2.4 2.4 0 00-1.76 1.76L12 17.2l-1.15-4.55a2.4 2.4 0 00-1.76-1.76L4.5 9.7l4.59-1.19a2.4 2.4 0 001.76-1.76L12 2.2z" />
              <path d="M18.2 14.1l.55 2.15c.1.4.42.72.82.82l2.13.55-2.13.55a1.1 1.1 0 00-.82.82l-.55 2.15-.55-2.15a1.1 1.1 0 00-.82-.82l-2.13-.55 2.13-.55c.4-.1.72-.42.82-.82l.55-2.15z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-base font-semibold tracking-tight text-app">Hello, IT</h2>
            <p className="line-clamp-2 text-xs text-app-muted">The assistant answers first. A ticket is created only after you confirm.</p>
          </div>
          <div className="flex shrink-0 items-center">
            {started && (
              <button
                type="button"
                onClick={newChat}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-app bg-app-surface-2 px-2.5 text-xs font-semibold text-app-soft hover:border-app-primary hover:text-app-primary"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
                </svg>
                New chat
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Ask IT"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-app-muted hover:bg-app-surface-2 hover:text-app"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div
          className={`ask-it-scroll min-h-0 flex-1 space-y-3 overflow-y-auto sm:space-y-4 ${floating ? 'px-3 py-3' : 'px-4 py-5 sm:px-6'}`}
          style={{ scrollbarColor: 'var(--app-primary) var(--app-panel-bg)', scrollbarWidth: 'thin' }}
        >
          {!started && (
            <div className={`mx-auto flex max-w-lg flex-col items-center px-1 text-center ${floating ? 'py-2' : 'py-8'}`}>
              <p className="text-lg font-semibold text-app">How can we help?</p>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-app-muted">
                Ask any question and the assistant will reply. Describe the issue or select a common topic, and attach a photo or document if it helps explain the problem.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {IDEAS.map((idea) => (
                  <button
                    key={idea.label}
                    type="button"
                    disabled={sending}
                    onClick={() => setDraft(idea.prompt)}
                    className="rounded-full border border-app bg-app-surface-2 px-3 py-1.5 text-xs font-medium text-app-soft transition-colors hover:border-app-primary hover:text-app-primary disabled:opacity-50"
                  >
                    {idea.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {visible.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                {message.topic && (
                  <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-app-primary">
                    {message.topic}
                  </p>
                )}
                <p
                  className={`whitespace-pre-wrap px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-2xl rounded-br-md bg-app-primary text-app-on-primary'
                      : 'rounded-2xl rounded-bl-md border border-app-subtle bg-app-surface-2 text-app-soft'
                  }`}
                >
                  {message.content}
                </p>
                {message.suggestManualTicket && onCreateTicket && (
                  <button
                    type="button"
                    onClick={onCreateTicket}
                    className="mt-2 rounded-full border border-app-primary px-3 py-1.5 text-xs font-semibold text-app-primary hover:bg-app-primary-soft"
                  >
                    Create manual ticket
                  </button>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <p className="rounded-2xl rounded-bl-md border border-app-subtle bg-app-surface-2 px-3.5 py-2.5 text-sm text-app-muted">
                {readingPhoto ? 'Reading the file…' : 'Writing a reply…'}
              </p>
            </div>
          )}
        </div>

        <div className={`space-y-2 border-t border-app-subtle sm:space-y-3 ${floating ? 'px-3 py-3' : 'px-4 py-4 sm:px-6'}`}>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {ticket && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-app bg-app-surface-2 px-3 py-2">
              <p className="text-sm text-app">
                Sent to IT as <span className="font-semibold">{ticket.ticketNumber}</span>
              </p>
              {onOpenTickets && (
                <button
                  type="button"
                  onClick={onOpenTickets}
                  className="text-xs font-semibold text-app-primary hover:underline"
                >
                  View tickets
                </button>
              )}
            </div>
          )}

          {(photos.length > 0 || docs.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {[...photos.map((file, index) => ({ file, index, kind: 'photo' as const })), ...docs.map((file, index) => ({ file, index, kind: 'doc' as const }))].map((item) => (
                <span
                  key={`${item.kind}-${item.file.name}-${item.index}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-app bg-app-surface-2 px-3 py-1 text-xs text-app-soft"
                >
                  <span className="truncate">{item.file.name}</span>
                  <button
                    type="button"
                    onClick={() => (item.kind === 'photo' ? removePhoto(item.index) : removeDoc(item.index))}
                    className="text-app-muted hover:text-app"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-app bg-app-surface-2 p-2">
            <label className="mb-0.5 inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-app-muted hover:bg-app-primary-soft hover:text-app-primary">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,.pdf,.docx,.xlsx,.pptx,.txt,.csv"
                multiple
                className="hidden"
                onChange={(event) => {
                  addFiles(Array.from(event.target.files ?? []));
                  event.target.value = '';
                }}
              />
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="sr-only">Attach file</span>
            </label>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={2}
              maxLength={1000}
              disabled={sending}
              placeholder="Describe the issue or ask a question"
              className="max-h-32 w-full resize-none bg-transparent px-1 py-1.5 text-sm text-app outline-none placeholder:text-app-muted disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || (!draft.trim() && !analyzePhotos && !analyzeDocs)}
              className="mb-0.5 inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-app-primary px-4 text-sm font-semibold text-app-on-primary disabled:opacity-40"
            >
              Send
            </button>
          </div>
          <div className="flex flex-col gap-1.5 px-1">
            <label className="inline-flex w-fit max-w-full items-center gap-2">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-app-muted">Model</span>
              <span className="relative inline-flex min-w-0 max-w-full">
                <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
                  <rect x="7" y="7" width="10" height="10" rx="2" strokeWidth={1.8} />
                </svg>
                <select
                  aria-label="Model"
                  value={model}
                  disabled={sending}
                  onChange={(event) => {
                    const next = event.target.value;
                    setModel(next);
                    window.localStorage.setItem('ask-it-model', next);
                  }}
                  className="h-8 max-w-full cursor-pointer appearance-none rounded-full border border-app bg-app-surface-2 pl-8 pr-8 text-xs font-semibold text-app outline-none disabled:opacity-60"
                >
                  {MODELS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </label>
            <p className="text-[11px] leading-relaxed text-app-muted">
              Attachments are reviewed with the message you send them on. Follow-up messages are text only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function shrinkPhoto(file: File): Promise<{ mimeType: string; data: string }> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not read the photo.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('Could not read the photo.'))), 'image/jpeg', 0.72);
  });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return { mimeType: 'image/jpeg', data: btoa(binary) };
}

const DOCUMENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
};

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}

function documentMime(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return DOCUMENT_TYPES[ext] ?? null;
}

function typedFile(file: File): File {
  const mime =
    documentMime(file) ||
    (file.type.startsWith('image/') ? file.type : '') ||
    file.type ||
    'application/octet-stream';
  return file.type === mime ? file : new File([file], file.name, { type: mime });
}

async function fileToChatFile(file: File): Promise<{ name: string; mimeType: string; data: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return {
    name: file.name,
    mimeType: documentMime(file) || 'text/plain',
    data: btoa(binary),
  };
}
