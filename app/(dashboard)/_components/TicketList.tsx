// @ts-nocheck
'use client';

import { LoadingDots } from '@/lib/ui/LoadingComponents';
import { TicketListSkeleton } from '@/lib/ui/DashboardSkeletons';

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { buildUrlWithoutTicketParams } from '@/lib/utils/ticketNavigation';
import { subscribeTicketEvents, subscribeUserProfileEvents } from '@/lib/realtime/socketClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { getTicketFeedbackStatus } from '@/lib/utils/notifications';
import FeedbackForm from '@/app/(dashboard)/_components/FeedbackForm';
import TicketConversation from '@/app/(dashboard)/_components/TicketConversation';
import { ExportMenu } from '@/lib/ui/ExportMenu';
import { ExportColumnDialog } from '@/lib/ui/ExportColumnDialog';
import {
  ALL_TICKET_EXPORT_COLUMN_KEYS,
  TICKET_EXPORT_COLUMN_SECTIONS,
  exportTicketsExcel,
  exportTicketsPdf,
} from '@/lib/utils/exportTickets';

const UserAvatar = ({ user, size = 'sm', className = '' }) => {
  const photoURL = user?.photoURL || user?.photo_url;
  const displayName = user?.name || user?.email || 'User';
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
  };
  const sizeClass = sizeClasses[size] || sizeClasses.sm;

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        className={`${sizeClass} rounded-full object-cover border border-app-subtle flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-app-primary flex items-center justify-center text-app-on-primary font-semibold border border-app-subtle flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
};

const UserChip = ({ user, label, size = 'sm' }) => {
  if (!user) return null;
  const displayName = user.name || user.email;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <UserAvatar user={user} size={size} />
      <div className="min-w-0 text-left">
        {label && (
          <p className="text-[10px] uppercase tracking-wide text-app-muted leading-none mb-0.5">{label}</p>
        )}
        <p className="text-xs sm:text-sm text-app-soft truncate">{displayName}</p>
      </div>
    </div>
  );
};

const getUserPhotoURL = (user) => user?.photoURL || user?.photo_url || null;

const mergeUserWithCache = (user, cache) => {
  if (!user?.id) return user || null;
  const cached = cache[user.id];
  return {
    ...(cached || {}),
    ...user,
    id: user.id,
    name: user.name || cached?.name,
    email: user.email || cached?.email,
    photoURL: getUserPhotoURL(user) || getUserPhotoURL(cached),
  };
};

const UserChipInline = ({ user, fallback = '—' }) => {
  if (!user) {
    return <span className="text-app-muted">{fallback}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0 max-w-full">
      <UserAvatar user={user} size="xs" />
      <span className="truncate">{user.name || user.email}</span>
    </span>
  );
};

const collectUsersFromTickets = (tickets) => {
  const users = [];
  for (const ticket of tickets) {
    if (ticket.creatorInfo) users.push(ticket.creatorInfo);
    if (ticket.creator) users.push(ticket.creator);
    if (ticket.assignedInfo) users.push(ticket.assignedInfo);
    if (ticket.assignee) users.push(ticket.assignee);
  }
  return users;
};

// Fixed StatusDropdown Component with working absolute positioning
const STATUS_CONFIRM_MESSAGES = {
  'in-progress': {
    title: 'Move to In Progress?',
    message: 'This ticket will be marked as in progress. The requester will be notified of the status change.',
    confirmLabel: 'Move to In Progress',
    confirmClass: 'bg-yellow-600 hover:bg-yellow-700',
  },
  resolved: {
    title: 'Mark as Resolved?',
    message: 'This ticket will be marked as resolved. The requester may submit feedback after resolution.',
    confirmLabel: 'Mark Resolved',
    confirmClass: 'bg-app-primary hover:opacity-90',
  },
};

const StatusDropdown = ({
  currentStatus,
  ticketId,
  ticketTitle,
  assignedTo,
  onStatusChange,
  compact = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [isOpen, setIsOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const hasAssignee = !!assignedTo;

  const statusOptions = [
    { value: 'open', label: 'Open', icon: '🔵' },
    { value: 'in-progress', label: 'In Progress', icon: '🟡' },
    { value: 'resolved', label: 'Mark Resolved', icon: '✅' },
  ];

  const getOptionDisabledReason = (optionValue) => {
    if (currentStatus === optionValue) return null;

    if (optionValue === 'in-progress' && currentStatus === 'open' && !hasAssignee) {
      return 'Assign a staff member before moving to In Progress';
    }

    if (optionValue === 'resolved') {
      if (currentStatus === 'open') {
        return 'Move the ticket to In Progress before marking as Resolved';
      }
      if (!hasAssignee) {
        return 'Assign a staff member before marking as Resolved';
      }
    }

    return null;
  };

  const isOptionDisabled = (optionValue) =>
    currentStatus === optionValue || !!getOptionDisabledReason(optionValue);

  const handleStatusSelect = (newStatus) => {
    if (isOptionDisabled(newStatus)) return;
    setIsOpen(false);
    if (newStatus !== currentStatus && STATUS_CONFIRM_MESSAGES[newStatus]) {
      setPendingStatus(newStatus);
      return;
    }
    onStatusChange(ticketId, newStatus);
  };

  const handleConfirmStatusChange = () => {
    if (!pendingStatus) return;
    onStatusChange(ticketId, pendingStatus);
    setPendingStatus(null);
  };

  const pendingConfirm = pendingStatus ? STATUS_CONFIRM_MESSAGES[pendingStatus] : null;

  const getCurrentStatusLabel = () => {
    switch (currentStatus) {
      case 'open': return 'Open';
      case 'in-progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      default: return 'Update Status';
    }
  };

  const getCurrentStatusIcon = () => {
    switch (currentStatus) {
      case 'open': return '🔵';
      case 'in-progress': return '🟡';
      case 'resolved': return '✅';
      case 'closed': return '📋';
      default: return '📋';
    }
  };

  const getCurrentStatusColors = () => {
    if (isLight) {
      switch (currentStatus) {
        case 'open':
          return {
            bg: 'bg-cyan-100',
            hover: 'hover:bg-cyan-200/90',
            border: 'border-cyan-300',
            text: 'text-cyan-950',
          };
        case 'in-progress':
          return {
            bg: 'bg-amber-100',
            hover: 'hover:bg-amber-200/90',
            border: 'border-amber-300',
            text: 'text-amber-950',
          };
        case 'resolved':
          return {
            bg: 'bg-app-primary',
            hover: 'hover:opacity-90',
            border: 'border-app-primary',
            text: 'text-app-on-primary',
          };
        case 'closed':
          return {
            bg: 'bg-app-surface-3',
            hover: 'hover:bg-app-surface-2',
            border: 'border-app',
            text: 'text-app',
          };
        default:
          return {
            bg: 'bg-blue-100',
            hover: 'hover:bg-blue-200/90',
            border: 'border-blue-300',
            text: 'text-blue-950',
          };
      }
    }

    switch (currentStatus) {
      case 'open':
        return {
          bg: 'bg-cyan-600',
          hover: 'hover:bg-cyan-500',
          border: 'border-cyan-500',
          text: 'text-white',
        };
      case 'in-progress':
        return {
          bg: 'bg-amber-600',
          hover: 'hover:bg-amber-500',
          border: 'border-amber-500',
          text: 'text-white',
        };
      case 'resolved':
        return {
          bg: 'bg-app-primary',
          hover: 'hover:opacity-90',
          border: 'border-app-primary',
          text: 'text-app-on-primary',
        };
      case 'closed':
        return {
          bg: 'bg-app-surface-3',
          hover: 'hover:opacity-90',
          border: 'border-app',
          text: 'text-app',
        };
      default:
        return {
          bg: 'bg-blue-600',
          hover: 'hover:bg-blue-500',
          border: 'border-blue-500',
          text: 'text-white',
        };
    }
  };

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportPad = 8;
    const preferredWidth = Math.max(rect.width, 200);
    const maxWidth = Math.min(preferredWidth, window.innerWidth - viewportPad * 2);
    let left = rect.left;
    if (left + maxWidth > window.innerWidth - viewportPad) {
      left = Math.max(viewportPad, window.innerWidth - viewportPad - maxWidth);
    }
    const spaceBelow = window.innerHeight - rect.bottom - viewportPad;
    const spaceAbove = rect.top - viewportPad;
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow;
    setMenuPos({
      top: openUp ? undefined : rect.bottom + 6,
      bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
      left,
      width: maxWidth,
      maxHeight: Math.max(140, Math.min(280, openUp ? spaceAbove - 6 : spaceBelow - 6)),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      const t = event.target;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const colors = getCurrentStatusColors();

  const menu = isOpen && menuPos && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Ticket status options"
          className="fixed z-[80] rounded-xl border border-app bg-app-panel shadow-xl overflow-y-auto"
          style={{
            top: menuPos.top,
            bottom: menuPos.bottom,
            left: menuPos.left,
            width: menuPos.width,
            maxHeight: menuPos.maxHeight,
          }}
        >
          {statusOptions.map((option) => {
            const disabledReason = getOptionDisabledReason(option.value);
            const isCurrent = currentStatus === option.value;
            const blocked = !!disabledReason;
            const disabled = isCurrent || blocked;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => handleStatusSelect(option.value)}
                title={disabledReason || (isCurrent ? 'Current status' : undefined)}
                disabled={disabled}
                className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm font-medium transition-colors flex flex-col gap-0.5 border-b border-app-subtle last:border-b-0 ${
                  isCurrent
                    ? 'bg-app-primary-soft text-app-primary cursor-default'
                    : blocked
                      ? 'bg-app-surface-2/40 text-app-muted cursor-not-allowed'
                      : 'text-app hover:bg-app-surface-2'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-base leading-none shrink-0" aria-hidden="true">
                    {option.icon}
                  </span>
                  <span className="font-semibold truncate flex-1">{option.label}</span>
                  {isCurrent ? (
                    <svg className="w-4 h-4 shrink-0 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </span>
                {blocked && (
                  <span className="text-[10px] sm:text-xs text-app-muted leading-snug pl-7">
                    {disabledReason}
                  </span>
                )}
              </button>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <div className="relative status-dropdown w-full min-w-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full min-w-0 ${compact ? 'px-2 py-1.5 text-[11px]' : 'px-2.5 sm:px-3 py-2 text-xs sm:text-sm'} ${colors.bg} ${colors.hover} ${colors.text} rounded-lg font-semibold transition-all duration-200 flex items-center justify-between gap-1.5 border ${colors.border} shadow-sm hover:shadow-md`}
        >
          <span className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className={`${compact ? 'text-sm' : 'text-base'} leading-none shrink-0`} aria-hidden="true">
              {getCurrentStatusIcon()}
            </span>
            <span className="truncate text-left">{getCurrentStatusLabel()}</span>
          </span>
          <svg
            className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5 sm:w-4 sm:h-4'} shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {menu}
      </div>

      {pendingConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-app-panel rounded-xl border border-app w-full max-w-md shadow-2xl">
            <div className="p-5 sm:p-6 border-b border-app-subtle">
              <h3 className="text-lg font-semibold text-app">{pendingConfirm.title}</h3>
              {ticketTitle && (
                <p className="text-sm text-app-primary mt-1 truncate">&quot;{ticketTitle}&quot;</p>
              )}
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-app-soft leading-relaxed">{pendingConfirm.message}</p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 p-5 sm:p-6 pt-0">
              <button
                type="button"
                onClick={() => setPendingStatus(null)}
                className="flex-1 px-4 py-2.5 bg-app-surface-2 hover:bg-app-surface-3 text-app rounded-lg text-sm font-medium transition-colors border border-app"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-colors ${pendingConfirm.confirmClass}`}
              >
                {pendingConfirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
const TicketList = ({
  showAllTickets = false,
  showUserTicketsOnly = false,
  adminMode = false,
  openTicketId = null,
  focusConversation = false,
  modalOnly = false,
  openKey = null,
  onTicketModalClose = null,
}) => {
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [mounted, setMounted] = useState(false);
  const [userCache, setUserCache] = useState({});
  const [viewMode, setViewMode] = useState('cards'); // 'auto', 'table', 'cards'
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedTicketForFeedback, setSelectedTicketForFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');
  const [exportError, setExportError] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isDesktopTable, setIsDesktopTable] = useState(false);
  const openedTicketRef = useRef(null);

  const statusColors = {
    open: 'bg-app-surface-3 text-cyan-400 border-cyan-500/40',
    'in-progress': 'bg-app-surface-3 text-yellow-400 border-yellow-500/40',
    resolved: 'bg-app-surface-3 text-app-primary border-app-primary/40',
    closed: 'bg-app-surface-3 text-app-muted border-app'
  };

  const priorityColors = {
    low: 'bg-app-surface-3 text-app-primary border-app-primary/40',
    medium: 'bg-app-surface-3 text-yellow-400 border-yellow-500/40',
    high: 'bg-app-surface-3 text-orange-400 border-orange-500/40',
    critical: 'bg-app-surface-3 text-red-400 border-red-500/40'
  };

  const renderStars = (rating) =>
    [1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-app-muted'}>
        ★
      </span>
    ));

  const FeedbackRatingBadge = ({ ticket, showSubmitter = false }) => {
    if (!ticket?.feedback?.rating) return null;

    const submitter = ticket.feedback.submittedBy;

    return (
      <span className="px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 bg-app-surface-3 text-yellow-400 border-yellow-500/40">
        <span className="flex items-center">{renderStars(ticket.feedback.rating)}</span>
        <span>{ticket.feedback.rating}/5</span>
        {showSubmitter && submitter && (
          <span className="text-yellow-300/80 truncate max-w-[120px]">
            · {submitter.name || submitter.email}
          </span>
        )}
      </span>
    );
  };

  const FeedbackRatingPanel = ({ ticket }) => {
    if (!ticket?.feedback?.rating) return null;

    const submitter = ticket.feedback.submittedBy;

    return (
      <div className="bg-yellow-500/10 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-yellow-500/30">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h4 className="text-base sm:text-lg font-semibold text-app">User Feedback</h4>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-lg">
            {renderStars(ticket.feedback.rating)}
            <span className="text-app font-semibold">{ticket.feedback.rating}/5</span>
          </div>
          {submitter && (
            <span className="text-sm text-app-soft">
              Rated by {submitter.name || submitter.email}
            </span>
          )}
          {ticket.feedback.createdAt && (
            <span className="text-sm text-app-muted">
              {formatDate(ticket.feedback.createdAt)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const normalizeTicket = useCallback((ticket, cache = {}) => {
    const creator = ticket.creator || ticket.creatorInfo || null;
    const assignee = ticket.assignee || ticket.assignedInfo || null;

    return {
      ...ticket,
      createdAt: ticket.createdAt ? new Date(ticket.createdAt) : new Date(),
      updatedAt: ticket.updatedAt ? new Date(ticket.updatedAt) : new Date(),
      resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : null,
      creatorInfo: mergeUserWithCache(creator, cache),
      assignedInfo: mergeUserWithCache(assignee, cache),
    };
  }, []);

  const applyUsersToCache = useCallback((users) => {
    if (!Array.isArray(users) || users.length === 0) return;

    setUserCache((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const user of users) {
        const userId = user?.id || user?.uid;
        if (!userId) continue;

        const photoURL = getUserPhotoURL(user) || getUserPhotoURL(next[userId]);
        const nextEntry = {
          id: userId,
          name: user.name || next[userId]?.name,
          email: user.email || next[userId]?.email,
          photoURL,
        };

        const prevEntry = next[userId];
        if (
          !prevEntry ||
          prevEntry.name !== nextEntry.name ||
          prevEntry.email !== nextEntry.email ||
          prevEntry.photoURL !== nextEntry.photoURL
        ) {
          next[userId] = nextEntry;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, []);

  const sortTickets = useCallback((ticketsData) => {
    return [...ticketsData].sort((a, b) => {
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'updatedAt') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      } else if (sortBy === 'status') {
        const statusOrder = { open: 3, 'in-progress': 2, resolved: 1, closed: 0 };
        return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
      }
      return 0;
    });
  }, [sortBy]);

  const loadTickets = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await api.get('/api/v1/tickets');
      const raw = Array.isArray(data) ? data : [];
      applyUsersToCache(collectUsersFromTickets(raw));
      let ticketsData = raw.map((ticket) => normalizeTicket(ticket));
      if (showUserTicketsOnly || (!showAllTickets && !adminMode)) {
        ticketsData = ticketsData.filter((t) => t.createdBy === currentUser.uid);
      }
      setTickets(sortTickets(ticketsData));
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, showAllTickets, showUserTicketsOnly, adminMode, sortTickets, normalizeTicket, applyUsersToCache]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)');
    const update = () => setIsDesktopTable(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!adminMode || !currentUser) return;
    api.get('/api/v1/users/admin')
      .then((data) => {
        const staff = (Array.isArray(data) ? data : []).filter(
          (u) => u.isActive !== false && ['admin', 'manager'].includes(u.role),
        );
        setAssignableUsers(staff);
        applyUsersToCache(staff);
      })
      .catch((err) => console.error('Error loading assignable users:', err));
  }, [adminMode, currentUser, applyUsersToCache]);

  useEffect(() => {
    if (userProfile?.id || userProfile?.uid) {
      applyUsersToCache([userProfile]);
    }
  }, [userProfile, applyUsersToCache]);

  useEffect(() => {
    setTickets((prev) => {
      if (!prev.length) return prev;
      let changed = false;
      const next = prev.map((ticket) => {
        const normalized = normalizeTicket(ticket, userCache);
        if (
          normalized.creatorInfo?.photoURL !== ticket.creatorInfo?.photoURL ||
          normalized.creatorInfo?.name !== ticket.creatorInfo?.name ||
          normalized.assignedInfo?.photoURL !== ticket.assignedInfo?.photoURL ||
          normalized.assignedInfo?.name !== ticket.assignedInfo?.name
        ) {
          changed = true;
          return normalized;
        }
        return ticket;
      });
      return changed ? sortTickets(next) : prev;
    });

    setSelectedTicketDetails((prev) => (prev ? normalizeTicket(prev, userCache) : prev));
  }, [userCache, normalizeTicket, sortTickets]);

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    loadTickets();
    const unsubTickets = subscribeTicketEvents(
      (ticket) => {
        if (!ticket?.id) return;
        applyUsersToCache(collectUsersFromTickets([ticket]));
        setTickets((prev) => {
          const normalized = normalizeTicket(ticket);
          if (showUserTicketsOnly && normalized.createdBy !== currentUser.uid) {
            return prev;
          }
          const idx = prev.findIndex((t) => t.id === normalized.id);
          const next = idx >= 0
            ? prev.map((t, i) => (i === idx ? normalized : t))
            : [normalized, ...prev];
          return sortTickets(next);
        });
      },
      (ticket) => {
        if (!ticket?.id) return;
        applyUsersToCache(collectUsersFromTickets([ticket]));
        setTickets((prev) => {
          const normalized = normalizeTicket(ticket);
          const idx = prev.findIndex((t) => t.id === normalized.id);
          if (idx < 0) return prev;
          const next = [...prev];
          next[idx] = normalized;
          return sortTickets(next);
        });

        setSelectedTicketDetails((prev) => {
          if (!prev || prev.id !== ticket.id) return prev;
          return normalizeTicket(ticket);
        });
      },
    );

    const unsubProfiles = subscribeUserProfileEvents((user) => {
      if (!user?.id && !user?.uid) return;
      applyUsersToCache([user]);
    });

    return () => {
      unsubTickets();
      unsubProfiles();
    };
  }, [currentUser, loadTickets, showUserTicketsOnly, sortTickets, normalizeTicket, applyUsersToCache]);

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.patch(`/api/v1/tickets/${ticketId}/status`, { status: newStatus });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert(error?.message || 'Failed to update ticket status');
    }
  };

  const handleAssignTicket = async (ticketId, assignedToId) => {
    setAssigningTicketId(ticketId);
    try {
      await api.patch(`/api/v1/tickets/${ticketId}/assign`, {
        assignedToId: assignedToId || null,
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      alert(error?.message || 'Failed to assign ticket');
    } finally {
      setAssigningTicketId(null);
    }
  };
  
  const handleFeedbackRequest = (ticket) => {
    setSelectedTicketForFeedback(ticket);
    setShowFeedbackForm(true);
  };

  const handleCloseFeedbackForm = () => {
    setShowFeedbackForm(false);
    setSelectedTicketForFeedback(null);
  };
  
  const handleViewDetails = (ticket) => {
    setSelectedTicketDetails(ticket);
    setShowTicketDetails(true);
  };

  const clearTicketUrlParams = useCallback(() => {
    if (!searchParams.get('ticket')) return;
    router.replace(
      buildUrlWithoutTicketParams(pathname, searchParams),
      { scroll: false },
    );
  }, [router, pathname, searchParams]);

  const closeTicketDetailsModal = useCallback(() => {
    setShowTicketDetails(false);
    setSelectedTicketDetails(null);
    openedTicketRef.current = null;
    clearTicketUrlParams();
    onTicketModalClose?.();
  }, [clearTicketUrlParams, onTicketModalClose]);

  useEffect(() => {
    if (!showTicketDetails) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeTicketDetailsModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showTicketDetails, closeTicketDetailsModal]);

  useEffect(() => {
    if (!openTicketId) return;

    const sessionKey = `${openTicketId}:${openKey ?? ''}`;
    if (openedTicketRef.current === sessionKey) return;

    const openTicket = (ticket) => {
      openedTicketRef.current = sessionKey;
      setSelectedTicketDetails(ticket);
      setShowTicketDetails(true);
      clearTicketUrlParams();

      if (focusConversation) {
        setTimeout(() => {
          document
            .getElementById('ticket-conversation')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 350);
      }
    };

    const existing = tickets.find((t) => t.id === openTicketId);
    if (existing) {
      openTicket(existing);
      return;
    }

    api
      .get(`/api/v1/tickets/${openTicketId}`)
      .then((data) => {
        if (data) openTicket(normalizeTicket(data));
      })
      .catch(() => {});
  }, [openTicketId, openKey, tickets, focusConversation, normalizeTicket, clearTicketUrlParams]);

  const filteredTickets = tickets.filter(ticket => {
    if (filter !== 'all' && ticket.status !== filter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    
    if (adminMode && assignedToFilter !== 'all') {
      if (assignedToFilter === 'unassigned' && ticket.assignedTo) return false;
      if (assignedToFilter === 'assigned' && !ticket.assignedTo) return false;
      if (assignedToFilter !== 'unassigned' && assignedToFilter !== 'assigned' && ticket.assignedTo !== assignedToFilter) return false;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = ticket.title?.toLowerCase().includes(searchLower);
      const matchesDescription = ticket.description?.toLowerCase().includes(searchLower);
      const matchesCreator = ticket.creatorInfo?.name?.toLowerCase().includes(searchLower) || 
                           ticket.creatorInfo?.email?.toLowerCase().includes(searchLower);
      const matchesAssigned = ticket.assignedInfo?.name?.toLowerCase().includes(searchLower) || 
                             ticket.assignedInfo?.email?.toLowerCase().includes(searchLower);
      const matchesTicketNumber = ticket.ticketNumber?.toLowerCase().includes(searchLower);
      
      if (!matchesTitle && !matchesDescription && !matchesCreator && !matchesAssigned && !matchesTicketNumber) return false;
    }
    
    return true;
  });

  const effectiveViewMode =
    viewMode === 'auto' ? (isDesktopTable ? 'table' : 'cards') : viewMode;
  const isCardView = effectiveViewMode === 'cards';
  const isCompactTableView = effectiveViewMode === 'table' && !isDesktopTable;
  const isDesktopTableView = effectiveViewMode === 'table' && isDesktopTable;
  const isCardsButtonActive =
    viewMode === 'cards' || (viewMode === 'auto' && !isDesktopTable);
  const isTableButtonActive =
    viewMode === 'table' || (viewMode === 'auto' && isDesktopTable);

  const filterSelectClass =
    'app-select w-full min-w-0 rounded-lg px-3 py-2.5 pr-10 text-sm lg:flex-1 lg:max-w-[180px]';
  const filterSelectWideClass =
    'app-select w-full min-w-0 rounded-lg px-3 py-2.5 pr-10 text-sm sm:col-span-2 lg:col-span-1 lg:flex-1 lg:max-w-[200px]';

  const renderAssignSelect = (ticket, { compact = false } = {}) => {
    if (!adminMode || ticket.status === 'closed') return null;
    return (
      <select
        value={ticket.assignedTo || ''}
        onChange={(e) => handleAssignTicket(ticket.id, e.target.value || null)}
        disabled={assigningTicketId === ticket.id}
        aria-label={`Assign ticket ${ticket.ticketNumber || ticket.id}`}
        className={`app-select w-full min-w-0 rounded-lg disabled:opacity-50 ${
          compact ? 'px-2 py-1.5 pr-8 text-[11px]' : 'px-3 py-2 pr-9 text-xs sm:text-sm'
        }`}
      >
        <option value="">Unassigned</option>
        {assignableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name || user.email}
          </option>
        ))}
      </select>
    );
  };

  const renderStatusControl = (ticket, { compact = false } = {}) => {
    if (adminMode && ticket.status !== 'closed' && ticket.status !== 'resolved') {
      return (
        <StatusDropdown
          currentStatus={ticket.status}
          ticketId={ticket.id}
          ticketTitle={ticket.title}
          assignedTo={ticket.assignedTo}
          onStatusChange={handleStatusChange}
          compact={compact}
        />
      );
    }

    if (adminMode && ticket.status === 'resolved') {
      return (
        <div
          className={`w-full min-w-0 rounded-lg font-semibold whitespace-nowrap flex items-center justify-center gap-1.5 border border-app-primary/40 bg-app-primary-soft text-app-primary ${
            compact ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs sm:text-sm'
          }`}
          title="Resolved tickets cannot be changed back to Open or In Progress"
        >
          <span className="leading-none" aria-hidden="true">✅</span>
          <span className="truncate">Resolved</span>
        </div>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1 rounded-lg font-medium border ${statusColors[ticket.status]} ${
        compact ? 'px-2 py-1 text-[11px]' : 'px-2 py-1 text-xs'
      }`}>
        {getStatusIcon(ticket.status)}
        <span className="capitalize">{ticket.status}</span>
      </span>
    );
  };

  const renderTicketActions = (ticket, layout = 'card') => {
    if (layout === 'desktop-table') {
      return (
        <div className="inline-flex items-center justify-end gap-1.5">
          {!adminMode &&
            ticket.status === 'resolved' &&
            ticket.createdBy === currentUser?.uid &&
            !ticket.feedbackSubmitted && (
              <button
                type="button"
                onClick={() => handleFeedbackRequest(ticket)}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
              >
                Feedback
              </button>
            )}
          <button
            type="button"
            onClick={() => handleViewDetails(ticket)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-app-primary text-app-on-primary rounded-lg text-[11px] font-semibold transition-colors hover:opacity-90"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
        </div>
      );
    }

    return (
      <div
        className={
          layout === 'compact-table'
            ? 'flex flex-col gap-2 w-full min-w-0 pt-3 border-t border-app-subtle'
            : 'flex flex-col gap-2 w-full min-w-0 sm:max-w-[220px] sm:ml-auto lg:ml-0 lg:w-[200px] lg:flex-shrink-0'
        }
      >
        {renderAssignSelect(ticket)}
        {adminMode && ticket.status !== 'closed' ? (
          <div className="w-full min-w-0">{renderStatusControl(ticket)}</div>
        ) : null}
        {!adminMode &&
          ticket.status === 'resolved' &&
          ticket.createdBy === currentUser?.uid &&
          !ticket.feedbackSubmitted && (
            <button
              type="button"
              onClick={() => handleFeedbackRequest(ticket)}
              className="w-full min-w-0 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors truncate"
            >
              Request Feedback
            </button>
          )}
        <button
          type="button"
          onClick={() => handleViewDetails(ticket)}
          className="w-full min-w-0 px-3 py-2 bg-app-primary text-app-on-primary rounded-lg text-xs sm:text-sm font-semibold transition-colors hover:opacity-90 truncate"
        >
          View Details
        </button>
      </div>
    );
  };

  const renderCompactTableRow = (ticket) => (
    <div
      key={ticket.id}
      className="app-card group relative rounded-xl border p-4"
    >
      <div className="accent-hover-line bg-app-primary" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          {ticket.ticketNumber && (
            <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-app-primary mb-1">
              {ticket.ticketNumber}
            </span>
          )}
          <h3 className="text-base font-semibold text-app leading-snug break-words">{ticket.title}</h3>
        </div>
        <button
          onClick={() => handleViewDetails(ticket)}
          className="flex-shrink-0 px-3 py-1.5 bg-app-surface-3 hover:bg-app-surface-2 text-app rounded-lg text-xs font-medium transition-colors"
        >
          View
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border inline-flex items-center gap-1 ${statusColors[ticket.status]}`}>
          {getStatusIcon(ticket.status)}
          <span className="capitalize">{ticket.status}</span>
        </span>
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border inline-flex items-center gap-1 ${priorityColors[ticket.priority]}`}>
          {getPriorityIcon(ticket.priority)}
          <span className="capitalize">{ticket.priority}</span>
        </span>
        {(showAllTickets || adminMode) && ticket.feedback?.rating && (
          <FeedbackRatingBadge ticket={ticket} showSubmitter={showAllTickets && ticket.createdBy !== currentUser?.uid} />
        )}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs mb-1">
        <div>
          <dt className="text-app-muted">Created</dt>
          <dd className="text-app-soft mt-0.5">{formatDate(ticket.createdAt)}</dd>
        </div>
        {getCompletedDate(ticket) && (
          <div>
            <dt className="text-app-muted">Completed</dt>
            <dd className="text-app-primary mt-0.5">{formatDate(getCompletedDate(ticket))}</dd>
          </div>
        )}
        {showAllTickets && ticket.creatorInfo && (
          <div>
            <dt className="text-app-muted">Created By</dt>
            <dd className="text-app-soft mt-0.5">
              <UserChipInline user={ticket.creatorInfo} />
            </dd>
          </div>
        )}
        {(showAllTickets || adminMode || showUserTicketsOnly) && (
          <div>
            <dt className="text-app-muted">Assigned</dt>
            <dd className="text-app-soft mt-0.5">
              <UserChipInline user={ticket.assignedInfo} fallback="Unassigned" />
            </dd>
          </div>
        )}
        {ticket.attachments?.length > 0 && (
          <div>
            <dt className="text-app-muted">Attachments</dt>
            <dd className="text-purple-300 mt-0.5">{ticket.attachments.length} photo{ticket.attachments.length > 1 ? 's' : ''}</dd>
          </div>
        )}
      </dl>

      {(adminMode || (!adminMode && ticket.status === 'resolved' && ticket.createdBy === currentUser?.uid && !ticket.feedbackSubmitted)) && (
        renderTicketActions(ticket, 'compact-table')
      )}
    </div>
  );

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const hasMeaningfulUpdate = (ticket) => {
    if (!ticket?.updatedAt || !ticket?.createdAt) return false;
    const created = ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt);
    const updated = ticket.updatedAt instanceof Date ? ticket.updatedAt : new Date(ticket.updatedAt);
    return updated.getTime() - created.getTime() > 60000;
  };

  const isCompletedTicket = (ticket) => ['resolved', 'closed'].includes(ticket?.status);

  const getCompletedDate = (ticket) => {
    if (!isCompletedTicket(ticket) || !ticket?.resolvedAt) return null;
    return ticket.resolvedAt instanceof Date ? ticket.resolvedAt : new Date(ticket.resolvedAt);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'in-progress':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'resolved':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'closed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'high':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10h14" />
          </svg>
        );
      case 'low':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l5 5m0 0l5-5m-5 5V6" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!mounted) return null;

  if (loading && !modalOnly) {
    return <TicketListSkeleton />;
  }

  if (loading && modalOnly) {
    return null;
  }

  const hasActiveFilters =
    !!searchTerm ||
    filter !== 'all' ||
    priorityFilter !== 'all' ||
    (adminMode && assignedToFilter !== 'all');

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilter('all');
    setPriorityFilter('all');
    if (adminMode) setAssignedToFilter('all');
  };

  const buildTicketFilterSummary = () => {
    const parts = [];
    if (searchTerm) parts.push(`Search: "${searchTerm}"`);
    if (filter !== 'all') parts.push(`Status: ${filter}`);
    if (priorityFilter !== 'all') parts.push(`Priority: ${priorityFilter}`);
    if (adminMode && assignedToFilter !== 'all') {
      if (assignedToFilter === 'unassigned') parts.push('Assignment: Unassigned');
      else if (assignedToFilter === 'assigned') parts.push('Assignment: Assigned');
      else {
        const assignee = assignableUsers.find((user) => user.id === assignedToFilter);
        parts.push(`Assignee: ${assignee?.name || assignee?.email || assignedToFilter}`);
      }
    }
    return parts.length ? parts.join(' · ') : 'None (all records)';
  };

  const runTicketExport = async (
    format,
    columns = ALL_TICKET_EXPORT_COLUMN_KEYS,
  ) => {
    if (exporting) return;
    if (!columns.length) {
      setExportError('Select at least one column to export.');
      setExportDialogOpen(true);
      return;
    }
    setExporting(true);
    setExportError('');
    setExportNotice('');
    try {
      if (filteredTickets.length === 0) {
        setExportError('No tickets match the current filters to export.');
        return;
      }
      const filterSummary = buildTicketFilterSummary();
      if (format === 'excel') {
        await exportTicketsExcel(filteredTickets, filterSummary, columns);
      } else {
        exportTicketsPdf(filteredTickets, filterSummary, columns);
      }
      setExportNotice(
        `Exported ${filteredTickets.length} ticket${filteredTickets.length === 1 ? '' : 's'} to ${format === 'excel' ? 'Excel' : 'PDF'}.`,
      );
      setExportDialogOpen(false);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={modalOnly ? undefined : 'space-y-6'}>
      {!modalOnly && (
      <>
      {/* Enhanced Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={adminMode ? 'Search tickets, users…' : 'Search tickets…'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="app-field block w-full pl-10 pr-3 py-2.5 border rounded-lg transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-app-muted hover:text-app transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col gap-3 w-full">
          {/* Status Filters — scroll on small screens */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide w-full">
            <button
              onClick={() => setFilter('all')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'app-chip--active border'
                  : 'app-chip hover:border-app-primary'
              }`}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'open'
                  ? 'bg-cyan-500/20 text-cyan-600 border border-cyan-500/30'
                  : 'app-chip hover:border-app-primary'
              }`}
            >
              Open ({tickets.filter(t => t.status === 'open').length})
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'in-progress'
                  ? 'bg-yellow-500/20 text-yellow-700 border border-yellow-500/30'
                  : 'app-chip hover:border-app-primary'
              }`}
            >
              In Progress ({tickets.filter(t => t.status === 'in-progress').length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'resolved'
                  ? 'app-chip--active border'
                  : 'app-chip hover:border-app-primary'
              }`}
            >
              Resolved ({tickets.filter(t => t.status === 'resolved').length})
            </button>
          </div>

          {/* Priority, Sort, View — responsive grid on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:flex-wrap gap-2 w-full">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={filterSelectClass}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {adminMode && (
              <select
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className={filterSelectWideClass}
              >
                <option value="all">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                <option value="assigned">Assigned</option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={filterSelectClass}
            >
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Updated Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
            </select>

            <div className="flex app-select-toolbar rounded-lg overflow-hidden w-full sm:w-auto sm:col-span-2 lg:col-span-1 lg:ml-auto lg:flex-shrink-0 self-stretch sm:self-auto">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex-1 sm:flex-none p-2.5 transition-colors ${
                  isCardsButtonActive ? 'bg-app-primary-soft text-app-primary' : 'text-app-muted hover:text-app'
                }`}
                title="Card View"
                aria-pressed={isCardsButtonActive}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 sm:flex-none p-2.5 transition-colors ${
                  isTableButtonActive ? 'bg-app-primary-soft text-app-primary' : 'text-app-muted hover:text-app'
                }`}
                title="Table View"
                aria-pressed={isTableButtonActive}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V6a2 2 0 012-2h14a2 2 0 012 2v16a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>

            {adminMode && (
              <ExportMenu
                className="w-full sm:w-auto sm:col-span-2 lg:col-span-1"
                disabled={filteredTickets.length === 0}
                exporting={exporting}
                onCustomize={() => setExportDialogOpen(true)}
                onExportExcel={() => runTicketExport('excel')}
                onExportPdf={() => runTicketExport('pdf')}
              />
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-app-muted">
          Showing {filteredTickets.length} of {tickets.length} tickets
          {searchTerm && ` matching "${searchTerm}"`}
          {priorityFilter !== 'all' && ` with ${priorityFilter} priority`}
          {adminMode && assignedToFilter !== 'all' && ` (${assignedToFilter})`}
        </div>

        {adminMode && exportNotice && (
          <div className="rounded-lg border border-app-primary/30 bg-app-primary-soft/40 px-3 py-2 text-sm text-app-primary">
            {exportNotice}
          </div>
        )}
        {adminMode && exportError && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
            {exportError}
          </div>
        )}
      </div>

      {adminMode && (
        <ExportColumnDialog
          open={exportDialogOpen}
          titleId="ticket-export-columns"
          allColumnKeys={ALL_TICKET_EXPORT_COLUMN_KEYS}
          columnSections={TICKET_EXPORT_COLUMN_SECTIONS}
          filterSummary={buildTicketFilterSummary()}
          exporting={exporting}
          onClose={() => setExportDialogOpen(false)}
          onExport={runTicketExport}
        />
      )}

      {/* Empty state — filters stay visible above */}
      {filteredTickets.length === 0 && !openTicketId ? (
        <div className="rounded-xl border border-dashed border-app bg-app-surface-2 px-5 py-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-app-surface-3 text-app-muted">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-app mb-1">No tickets found</h3>
          <p className="text-sm text-app-muted max-w-md mx-auto">
            {hasActiveFilters
              ? 'No tickets match your current filters.'
              : showAllTickets
                ? 'No tickets have been created yet.'
                : "You haven't created any tickets yet."}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-app-primary rounded-xl text-sm font-medium transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : isCardView ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="app-card group relative rounded-xl border p-4 sm:p-5"
            >
              <div className="accent-hover-line bg-app-primary" aria-hidden="true" />
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      {ticket.ticketNumber && (
                        <div className="flex items-center gap-2 self-start">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-app-primary-soft text-app-primary border-app-primary/30">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <span className="text-app-primary/80">Ticket No.</span>
                            <span className="font-mono font-semibold text-app-primary">{ticket.ticketNumber}</span>
                          </span>
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-app truncate">{ticket.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${statusColors[ticket.status]}`}>
                        {getStatusIcon(ticket.status)}
                        <span className="capitalize">{ticket.status}</span>
                      </span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 ${priorityColors[ticket.priority]}`}>
                        {getPriorityIcon(ticket.priority)}
                        <span className="capitalize">{ticket.priority}</span>
                      </span>
                      {showAllTickets && ticket.assignedInfo && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 bg-app-surface-3 text-blue-400 border-blue-500/40">
                          <UserAvatar user={ticket.assignedInfo} size="xs" />
                          {ticket.assignedInfo.name || ticket.assignedInfo.email}
                        </span>
                      )}
                      {(showAllTickets || adminMode) && ticket.feedback?.rating && (
                        <FeedbackRatingBadge
                          ticket={ticket}
                          showSubmitter={showAllTickets && ticket.createdBy !== currentUser?.uid}
                        />
                      )}
                      {!showAllTickets && !adminMode && ticket.feedback?.rating && (
                        <FeedbackRatingBadge ticket={ticket} />
                      )}
                      {ticket.attachments?.length > 0 && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium border flex items-center gap-1 bg-app-surface-3 text-purple-300 border-purple-500/40">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {ticket.attachments.length} photo{ticket.attachments.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-app-muted mb-3 line-clamp-2 text-sm sm:text-base">{ticket.description}</p>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-app-muted">
                      <span>Created: {formatDate(ticket.createdAt)}</span>
                      {getCompletedDate(ticket) && (
                        <span className="text-app-primary font-medium">
                          Completed: {formatDate(getCompletedDate(ticket))}
                        </span>
                      )}
                    </div>

                    {(showAllTickets || adminMode || showUserTicketsOnly) && (ticket.creatorInfo || ticket.assignedInfo) && (
                      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-app-subtle">
                        {showAllTickets && ticket.creatorInfo && (
                          <UserChip user={ticket.creatorInfo} label="Created by" />
                        )}
                        {(showAllTickets || adminMode || showUserTicketsOnly) && ticket.assignedInfo && (
                          <UserChip user={ticket.assignedInfo} label="Assigned to" />
                        )}
                        {(showAllTickets || adminMode) && !ticket.assignedInfo && (
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full border border-dashed border-app flex items-center justify-center text-app-muted flex-shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="text-[10px] uppercase tracking-wide text-app-muted leading-none mb-0.5">Assigned to</p>
                              <p className="text-xs sm:text-sm text-app-muted">Unassigned</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {renderTicketActions(ticket, 'card')}
              </div>
            </div>
          ))}
        </div>
      ) : isCompactTableView ? (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => renderCompactTableRow(ticket))}
        </div>
      ) : (
        <div className="app-card hidden xl:block overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-app bg-app-surface-2/60 text-left text-[11px] uppercase tracking-wide text-app-muted">
                <th className="px-3 py-2.5 font-semibold whitespace-nowrap w-[120px]">Ticket No.</th>
                <th className="px-3 py-2.5 font-semibold min-w-[200px]">Title</th>
                <th className="px-3 py-2.5 font-semibold whitespace-nowrap w-[140px]">Status</th>
                <th className="px-3 py-2.5 font-semibold whitespace-nowrap w-[110px]">Priority</th>
                <th className="px-3 py-2.5 font-semibold whitespace-nowrap hidden md:table-cell w-[130px]">Created</th>
                {showAllTickets && (
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap hidden lg:table-cell w-[150px]">Created By</th>
                )}
                {(showAllTickets || adminMode || showUserTicketsOnly) && (
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap hidden lg:table-cell w-[160px]">Assigned</th>
                )}
                <th className="px-3 py-2.5 font-semibold whitespace-nowrap text-right w-[88px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--app-border-subtle)]">
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="hover:bg-app-surface-2/50 transition-colors"
                >
                  <td className="px-3 py-2.5 align-middle">
                    <button
                      type="button"
                      onClick={() => handleViewDetails(ticket)}
                      className="font-mono text-xs font-semibold text-app-primary hover:opacity-80 whitespace-nowrap transition-colors"
                    >
                      {ticket.ticketNumber || '—'}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 align-middle max-w-[240px] lg:max-w-[320px]">
                    <p className="font-medium text-app truncate leading-snug" title={ticket.title}>{ticket.title}</p>
                    <p className="text-[11px] text-app-muted line-clamp-1 mt-0.5 leading-snug">{ticket.description}</p>
                  </td>
                  <td className="px-3 py-2.5 align-middle min-w-[132px] max-w-[160px]">
                    <div className="w-full min-w-0">
                      {renderStatusControl(ticket, { compact: true })}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border ${priorityColors[ticket.priority]}`}>
                      {getPriorityIcon(ticket.priority)}
                      <span className="capitalize">{ticket.priority}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 align-middle text-app-muted text-[11px] whitespace-nowrap hidden md:table-cell">
                    <div>{formatDate(ticket.createdAt)}</div>
                    {getCompletedDate(ticket) && (
                      <div className="text-app-primary mt-0.5">
                        Done {formatDate(getCompletedDate(ticket))}
                      </div>
                    )}
                  </td>
                  {showAllTickets && (
                    <td className="px-3 py-2.5 align-middle text-app-soft text-xs hidden lg:table-cell max-w-[160px]">
                      <UserChipInline user={ticket.creatorInfo} />
                    </td>
                  )}
                  {(showAllTickets || adminMode || showUserTicketsOnly) && (
                    <td className="px-3 py-2.5 align-middle text-app-soft text-xs hidden lg:table-cell min-w-[140px] max-w-[180px]">
                      {adminMode && ticket.status !== 'closed' ? (
                        renderAssignSelect(ticket, { compact: true })
                      ) : (
                        <UserChipInline user={ticket.assignedInfo} fallback="Unassigned" />
                      )}
                    </td>
                  )}
                  <td className="px-3 py-2.5 align-middle">
                    <div className="flex justify-end">
                      {renderTicketActions(ticket, 'desktop-table')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      </>
      )}

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicketDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-slide-up-fade"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTicketDetailsModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ticket Details"
            className="relative w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-app bg-app-panel shadow-xl animate-scale-in"
          >
            <div className="absolute inset-x-0 top-0 h-0.5 bg-app-primary z-10" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-app-subtle bg-app-panel shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-app-primary-soft text-app-primary ring-1 ring-app-primary/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-bold text-app truncate">Ticket Details</h2>
                  {selectedTicketDetails.ticketNumber ? (
                    <p className="mt-0.5 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                      <span className="text-app-muted">Ticket No.</span>
                      <span className="text-app-primary font-mono font-semibold">{selectedTicketDetails.ticketNumber}</span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-app-muted truncate">#{selectedTicketDetails.id}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeTicketDetailsModal}
                className="p-2 text-app-muted hover:text-app transition-all duration-200 rounded-lg hover:bg-app-surface-3 hover:rotate-90 shrink-0"
                aria-label="Close"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
              {/* Title + badges */}
              <section className="app-card group relative overflow-hidden rounded-xl border p-4 sm:p-5">
                <div className="accent-hover-line bg-app-primary" aria-hidden="true" />
                <h3 className="text-base sm:text-lg font-bold text-app leading-snug break-words">
                  {selectedTicketDetails.title}
                </h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 ${statusColors[selectedTicketDetails.status]}`}>
                    {getStatusIcon(selectedTicketDetails.status)}
                    <span className="capitalize">{selectedTicketDetails.status}</span>
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 ${priorityColors[selectedTicketDetails.priority]}`}>
                    {getPriorityIcon(selectedTicketDetails.priority)}
                    <span className="capitalize">{selectedTicketDetails.priority}</span>
                  </span>
                  {(adminMode || showAllTickets) && selectedTicketDetails.assignedInfo && (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium border inline-flex items-center gap-1.5 bg-app-surface-3 text-blue-400 border-blue-500/40">
                      <UserAvatar user={selectedTicketDetails.assignedInfo} size="xs" />
                      <span className="truncate max-w-[140px] sm:max-w-none">
                        {selectedTicketDetails.assignedInfo.name || selectedTicketDetails.assignedInfo.email}
                      </span>
                    </span>
                  )}
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Description */}
                <section className="app-card lg:col-span-2 rounded-xl border p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-app-primary-soft text-app-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
                      </svg>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-app">Description</h4>
                  </div>
                  <p className="text-sm text-app-soft leading-relaxed whitespace-pre-wrap break-words">
                    {selectedTicketDetails.description}
                  </p>

                  {selectedTicketDetails.attachments?.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-app-subtle">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-semibold text-app">
                          Screenshots ({selectedTicketDetails.attachments.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {selectedTicketDetails.attachments.map((attachment) => (
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() => setLightboxImage(attachment)}
                            className="group relative rounded-xl overflow-hidden border border-app-subtle bg-app-surface-2/80 aspect-square hover:border-app-primary transition-colors"
                          >
                            {attachment.url ? (
                              <img
                                src={attachment.url}
                                alt={attachment.fileName || 'Ticket attachment'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-app-muted text-xs px-2 text-center">
                                Unavailable
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                              <p className="text-[10px] sm:text-xs text-app-soft truncate">
                                {attachment.fileName || 'Screenshot'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Information */}
                <section className="app-card rounded-xl border p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-app-primary-soft text-app-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-app">Information</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-app-muted text-xs block mb-1">Ticket Number</span>
                      <span className="text-app-primary font-mono text-sm font-semibold bg-app-primary-soft px-2 py-1 rounded-lg inline-block border border-app-primary/25">
                        {selectedTicketDetails.ticketNumber || 'N/A'}
                      </span>
                    </div>
                    {adminMode && (
                      <div>
                        <span className="text-app-muted text-xs block mb-1">Internal ID</span>
                        <span className="text-app-muted font-mono text-[10px] bg-app-surface-2/50 px-2 py-1 rounded-lg break-all inline-block">
                          {selectedTicketDetails.id}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-app-muted text-xs block mb-1">Created</span>
                      <span className="text-app text-sm">{formatDate(selectedTicketDetails.createdAt)}</span>
                    </div>
                    {getCompletedDate(selectedTicketDetails) ? (
                      <div>
                        <span className="text-app-muted text-xs block mb-1">Completed</span>
                        <span className="text-app-primary text-sm">
                          {formatDate(getCompletedDate(selectedTicketDetails))}
                        </span>
                      </div>
                    ) : hasMeaningfulUpdate(selectedTicketDetails) ? (
                      <div>
                        <span className="text-app-muted text-xs block mb-1">Last Updated</span>
                        <span className="text-app text-sm">{formatDate(selectedTicketDetails.updatedAt)}</span>
                      </div>
                    ) : null}
                    {showAllTickets && selectedTicketDetails.creatorInfo && (
                      <div>
                        <span className="text-app-muted text-xs block mb-1.5">Created by</span>
                        <UserChip user={selectedTicketDetails.creatorInfo} />
                      </div>
                    )}
                    {adminMode && selectedTicketDetails.status !== 'closed' && (
                      <div>
                        <span className="text-app-muted text-xs block mb-1.5">Assign to</span>
                        <select
                          value={selectedTicketDetails.assignedTo || ''}
                          onChange={(e) => {
                            const value = e.target.value || null;
                            handleAssignTicket(selectedTicketDetails.id, value);
                            setSelectedTicketDetails((prev) => {
                              if (!prev) return prev;
                              const assignee = assignableUsers.find((u) => u.id === value) || null;
                              return {
                                ...prev,
                                assignedTo: value,
                                assignedInfo: assignee
                                  ? {
                                      id: assignee.id,
                                      name: assignee.name,
                                      email: assignee.email,
                                      photoURL: assignee.photoURL || assignee.photo_url || null,
                                    }
                                  : null,
                              };
                            });
                          }}
                          disabled={assigningTicketId === selectedTicketDetails.id}
                          className="app-field w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none disabled:opacity-50"
                        >
                          <option value="">Unassigned</option>
                          {assignableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name || user.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {(selectedTicketDetails.category || selectedTicketDetails.department || selectedTicketDetails.tags) && (
                <section className="app-card rounded-xl border p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h4 className="text-sm sm:text-base font-semibold text-app">Additional Details</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {selectedTicketDetails.category && (
                      <div className="rounded-xl bg-app-surface-2/50 border border-app-subtle px-3 py-2.5">
                        <span className="text-app-muted text-xs block mb-0.5">Category</span>
                        <span className="text-app font-medium text-sm capitalize break-words">{selectedTicketDetails.category}</span>
                      </div>
                    )}
                    {selectedTicketDetails.department && (
                      <div className="rounded-xl bg-app-surface-2/50 border border-app-subtle px-3 py-2.5">
                        <span className="text-app-muted text-xs block mb-0.5">Department</span>
                        <span className="text-app font-medium text-sm break-words">{selectedTicketDetails.department}</span>
                      </div>
                    )}
                    {selectedTicketDetails.tags && selectedTicketDetails.tags.length > 0 && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <span className="text-app-muted text-xs block mb-2">Tags</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedTicketDetails.tags.map((tag, index) => (
                            <span key={index} className="px-2.5 py-1 bg-app-primary-soft text-app-primary rounded-lg text-xs border border-app-primary/30">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <FeedbackRatingPanel ticket={selectedTicketDetails} />

              {/* Conversation: creator + staff only (enforced in TicketConversation + API) */}
              <TicketConversation
                ticketId={selectedTicketDetails.id}
                ticketStatus={selectedTicketDetails.status}
                createdBy={selectedTicketDetails.createdBy || selectedTicketDetails.creatorInfo?.id}
                currentUserId={currentUser?.uid}
                currentUserRole={currentUser?.role || userProfile?.role}
                onImageClick={(attachment) => setLightboxImage(attachment)}
                scrollIntoViewOnMount={focusConversation}
              />
            </div>

            {/* Footer */}
            <div className="shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end p-4 sm:p-5 border-t border-app bg-app-surface-2/50">
              {!adminMode && selectedTicketDetails.status === 'resolved' && selectedTicketDetails.createdBy === currentUser?.uid && !selectedTicketDetails.feedbackSubmitted && (
                <button
                  type="button"
                  onClick={() => {
                    const ticket = selectedTicketDetails;
                    closeTicketDetailsModal();
                    handleFeedbackRequest(ticket);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Give Feedback
                </button>
              )}
              <button
                type="button"
                onClick={closeTicketDetailsModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-app-primary hover:opacity-90 text-app-on-primary rounded-xl text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImage?.url && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-app-surface-2 hover:bg-app-surface-3 text-app transition-colors"
            aria-label="Close image preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.fileName || 'Ticket attachment'}
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />
            {lightboxImage.fileName && (
              <p className="mt-3 text-sm text-app-soft text-center break-all px-4">
                {lightboxImage.fileName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Feedback Form */}
      <FeedbackForm
        ticketId={selectedTicketForFeedback?.id}
        ticketTitle={selectedTicketForFeedback?.title}
        isOpen={showFeedbackForm}
        onClose={handleCloseFeedbackForm}
      />
    </div>
  );
};

export default TicketList;
