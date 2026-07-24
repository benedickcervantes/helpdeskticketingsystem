// @ts-nocheck
'use client';


import { SkeletonTable, LoadingDots } from '@/lib/ui/LoadingComponents';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api/client';
import {
  subscribeDepartmentEvents,
  subscribeDesignationEvents,
  subscribeUserProfileEvents,
} from '@/lib/realtime/socketClient';
import OptionPickerModal from '@/lib/ui/OptionPickerModal';
import { ExportMenu } from '@/lib/ui/ExportMenu';
import { ExportColumnDialog } from '@/lib/ui/ExportColumnDialog';
import {
  ALL_USER_EXPORT_COLUMN_KEYS,
  USER_EXPORT_COLUMN_SECTIONS,
  exportUsersExcel,
  exportUsersPdf,
} from '@/lib/utils/exportUsers';

const roleBadgeClass = (role) => {
  switch (role) {
    case 'admin':
      return 'bg-app-primary-soft text-app-primary border-app-primary/30';
    case 'manager':
      return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
    default:
      return 'bg-app-surface-2 text-app-soft border-app';
  }
};

const statusBadgeClass = (isActive) =>
  isActive
    ? 'bg-app-primary-soft text-app-primary border-app-primary/30'
    : 'bg-rose-500/15 text-rose-600 border-rose-500/30';

const formatRoleLabel = (role) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';

const UserAvatar = ({ user, size = 'md' }) => {
  const photoURL = user?.photoURL || user?.photo_url;
  const displayName = user?.name || user?.email || 'User';
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-lg',
  };
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        className={`inline-flex ${sizeClass} rounded-full object-cover border border-app-subtle flex-shrink-0`}
      />
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${sizeClass} rounded-full bg-app-primary text-app-on-primary font-semibold flex-shrink-0`}>
      {displayName.charAt(0).toUpperCase()}
    </span>
  );
};

const UserFormModal = ({
  open,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel,
  submitting = false,
  submitLoadingLabel = 'Saving…',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || submitting) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, submitting, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close modal"
        onClick={submitting ? undefined : onClose}
        disabled={submitting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-modal-title"
        className="relative z-10 flex w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[min(90dvh,720px)] flex-col bg-app-panel border border-app rounded-t-2xl sm:rounded-xl shadow-2xl"
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-app-subtle px-4 py-3 sm:px-6 sm:py-4">
          <h3 id="user-form-modal-title" className="text-base sm:text-xl font-bold text-app pr-2">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-shrink-0 rounded-lg p-2 text-app-muted transition-colors hover:bg-app-surface-3 hover:text-app disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <fieldset disabled={submitting} className="min-w-0 space-y-3 sm:space-y-4 border-0 p-0">
              {children}
            </fieldset>
          </div>

          <div className="flex flex-shrink-0 flex-col-reverse gap-2 border-t border-app-subtle bg-app-panel px-4 py-3 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2.5 border border-app rounded-xl text-sm font-medium text-app-soft bg-app-surface-2 hover:bg-app-surface-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-app-primary text-app-on-primary hover:opacity-90 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-app-on-primary border-t-transparent rounded-full animate-spin" />
                  {submitLoadingLabel}
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

const DeleteUserModal = ({ open, user, deleting, onClose, onConfirm }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || deleting) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, deleting, onClose]);

  if (!open || !mounted || !user) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close modal"
        onClick={deleting ? undefined : onClose}
        disabled={deleting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-modal-title"
        className="relative z-10 w-full sm:max-w-md bg-app-panel border border-app rounded-t-2xl sm:rounded-xl shadow-2xl p-4 sm:p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="delete-user-modal-title" className="text-base sm:text-lg font-bold text-app">
              Delete user permanently?
            </h3>
            <p className="mt-1 text-sm text-app-muted">
              This will permanently remove{' '}
              <span className="font-semibold text-app">{user.name}</span>
              {user.email ? (
                <>
                  {' '}
                  (<span className="font-mono text-xs text-app-soft">{user.email}</span>)
                </>
              ) : null}{' '}
              from the database.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2.5 text-xs sm:text-sm text-rose-700">
          Tickets they created and related activity will also be removed. This cannot be undone.
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="w-full sm:w-auto px-4 py-2.5 border border-app rounded-xl text-sm font-medium text-app-soft bg-app-surface-2 hover:bg-app-surface-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              'Delete permanently'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'cards' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    designation: '',
    department: '',
    role: 'user',
    isActive: true,
    password: '',
  });
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    password: '',
    designation: '',
    department: '',
    role: 'user',
    isActive: true,
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [editDesignationPickerOpen, setEditDesignationPickerOpen] = useState(false);
  const [editDepartmentPickerOpen, setEditDepartmentPickerOpen] = useState(false);
  const [addDesignationPickerOpen, setAddDesignationPickerOpen] = useState(false);
  const [addDepartmentPickerOpen, setAddDepartmentPickerOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const roles = ['user', 'admin', 'manager'];

  const pickerTriggerClass =
    'mt-1 flex w-full min-w-0 max-w-full items-center justify-between gap-2 app-field border rounded-xl shadow-sm py-2.5 px-3 text-left text-sm focus:outline-none';

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.get('/api/v1/users/admin');
      setUsers(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const toNames = (data) =>
    (Array.isArray(data) ? data : [])
      .map((d) => (typeof d === 'string' ? d : d?.name))
      .filter(Boolean);

  const loadDepartments = useCallback(async () => {
    try {
      const data = await api.get('/api/v1/departments');
      setDepartments(toNames(data));
    } catch (err) {
      console.error('Error fetching departments:', err);
      setDepartments([]);
    }
  }, []);

  const loadDesignations = useCallback(async () => {
    try {
      const data = await api.get('/api/v1/designations');
      setDesignations(toNames(data));
    } catch (err) {
      console.error('Error fetching designations:', err);
      setDesignations([]);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadDepartments();
    loadDesignations();
  }, [loadUsers, loadDepartments, loadDesignations]);

  useEffect(() => {
    const unsubscribeDepartments = subscribeDepartmentEvents((items) => {
      setDepartments((items || []).map((d) => d.name).filter(Boolean));
    });
    const unsubscribeDesignations = subscribeDesignationEvents((items) => {
      setDesignations((items || []).map((d) => d.name).filter(Boolean));
    });
    return () => {
      unsubscribeDepartments();
      unsubscribeDesignations();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeUserProfileEvents((updatedUser) => {
      if (!updatedUser?.id) return;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updatedUser.id
            ? {
                ...u,
                ...updatedUser,
                photoURL: updatedUser.photoURL || updatedUser.photo_url || u.photoURL,
              }
            : u,
        ),
      );
    });
    return unsubscribe;
  }, []);

  const departmentOptions = Array.from(
    new Set([
      ...departments,
      ...users.map((u) => u.department).filter(Boolean),
    ]),
  ).sort((a, b) => a.localeCompare(b));

  // Filter and sort users
  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.department?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesDepartment =
        filterDepartment === 'all' ||
        (filterDepartment === 'none'
          ? !user.department
          : user.department === filterDepartment);
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && user.isActive) ||
                           (filterStatus === 'inactive' && !user.isActive);
      return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt') {
        aValue = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        bValue = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const buildUserFilterSummary = () => {
    const parts = [];
    if (searchTerm) parts.push(`Search: "${searchTerm}"`);
    if (filterRole !== 'all') parts.push(`Role: ${filterRole}`);
    if (filterDepartment === 'none') parts.push('Department: None');
    else if (filterDepartment !== 'all') parts.push(`Department: ${filterDepartment}`);
    if (filterStatus !== 'all') parts.push(`Status: ${filterStatus}`);
    return parts.length ? parts.join(' · ') : 'None (all records)';
  };

  const runUserExport = async (format, columns = ALL_USER_EXPORT_COLUMN_KEYS) => {
    if (exporting) return;
    if (!columns.length) {
      setError('Select at least one column to export.');
      setExportDialogOpen(true);
      return;
    }
    setExporting(true);
    setError('');
    setNotice('');
    try {
      if (filteredAndSortedUsers.length === 0) {
        setError('No users match the current filters to export.');
        return;
      }
      const filterSummary = buildUserFilterSummary();
      if (format === 'excel') {
        await exportUsersExcel(filteredAndSortedUsers, filterSummary, columns);
      } else {
        exportUsersPdf(filteredAndSortedUsers, filterSummary, columns);
      }
      setNotice(
        `Exported ${filteredAndSortedUsers.length} user${filteredAndSortedUsers.length === 1 ? '' : 's'} to ${format === 'excel' ? 'Excel' : 'PDF'}.`,
      );
      setExportDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      designation: user.designation || '',
      department: user.department || '',
      role: user.role,
      isActive: user.isActive,
      password: '',
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting || !selectedUser?.id) return;
    try {
      setFormSubmitting(true);
      setError('');
      const payload = {
        name: editFormData.name,
        email: editFormData.email,
        designation: editFormData.designation.trim() || null,
        department: editFormData.department,
        role: editFormData.role,
        isActive: editFormData.isActive,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }
      await api.patch(`/api/v1/users/admin/${selectedUser.id}`, payload);
      setShowEditModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    try {
      setFormSubmitting(true);
      setError('');
      await api.post('/api/v1/users/admin', {
        name: addFormData.name,
        email: addFormData.email,
        password: addFormData.password,
        designation: addFormData.designation.trim() || undefined,
        department: addFormData.department,
        role: addFormData.role,
      });
      
      setShowAddModal(false);
      setAddFormData({
        name: '',
        email: '',
        password: '',
        designation: '',
        department: '',
        role: 'user',
        isActive: true,
      });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    if (!user?.id || togglingUserId || deletingUser) return;
    try {
      setTogglingUserId(user.id);
      setError('');
      await api.patch(`/api/v1/users/admin/${user.id}`, {
        isActive: !user.isActive,
      });
      await loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status. Please try again.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const isUserActionBusy = (userId) =>
    Boolean(togglingUserId || deletingUser || (userId && togglingUserId === userId));

  const openDeleteModal = (user) => {
    setError('');
    setUserToDelete(user);
  };

  const closeDeleteModal = () => {
    if (deletingUser) return;
    setUserToDelete(null);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete?.id || deletingUser) return;

    const userId = userToDelete.id;
    try {
      setDeletingUser(true);
      setError('');
      setNotice('');
      const result = await api.delete(`/api/v1/users/admin/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setNotice(result?.message || 'User deleted successfully from the database.');
      setUserToDelete(null);
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user. Please try again.');
    } finally {
      setDeletingUser(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Enhanced Mobile Card Component with better responsiveness
  const UserCard = ({ user }) => (
    <div className="app-card rounded-xl border p-3 sm:p-4 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <UserAvatar user={user} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-lg font-semibold text-app truncate">
              {user.name}
            </h3>
            <p className="text-xs sm:text-sm text-app-muted truncate">
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 sm:space-y-2 flex-shrink-0">
          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] font-semibold rounded-lg border ${statusBadgeClass(user.isActive)}`}>
            {user.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[11px] font-semibold rounded-lg border ${roleBadgeClass(user.role)}`}>
            {formatRoleLabel(user.role)}
          </span>
        </div>
      </div>
      
      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
        <div className="flex items-center justify-between">
          <span className="text-app-muted">Department:</span>
          <span className="text-app-soft text-right max-w-[60%] truncate">{user.department || 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-app-muted">Created:</span>
          <span className="text-app-soft">{formatDate(user.createdAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 sm:gap-2 pt-2 sm:pt-3 border-t border-app">
        <button
          type="button"
          onClick={() => handleEditClick(user)}
          disabled={isUserActionBusy(user.id)}
          className="flex-1 min-w-[60px] sm:min-w-[70px] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-app-primary-soft text-app-primary border border-app-primary/30 rounded-lg hover:bg-app-primary-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => handleToggleActive(user)}
          disabled={isUserActionBusy(user.id)}
          className={`flex-1 min-w-[60px] sm:min-w-[70px] inline-flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            user.isActive 
              ? 'bg-amber-500/15 text-amber-700 border-amber-500/30 hover:bg-amber-500/25'
              : 'bg-app-primary-soft text-app-primary border-app-primary/30 hover:bg-app-primary-soft'
          }`}
        >
          {togglingUserId === user.id ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Updating…
            </>
          ) : user.isActive ? (
            'Disable'
          ) : (
            'Enable'
          )}
        </button>
        <button
          type="button"
          onClick={() => openDeleteModal(user)}
          disabled={isUserActionBusy(user.id)}
          className="flex-1 min-w-[60px] sm:min-w-[70px] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-rose-500/15 text-rose-600 border border-rose-500/30 rounded-lg hover:bg-rose-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="app-card rounded-xl border p-3 sm:p-4 md:p-6 user-management-robust-fix">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-app-surface-3 rounded w-32 sm:w-48"></div>
          </div>
          <LoadingDots />
        </div>
        <SkeletonTable rows={6} />
      </div>
    );
  }

  return (
    <div className="app-card rounded-xl border p-3 sm:p-4 md:p-6 user-management-robust-fix">
      {/* Enhanced Header with Search and Filters */}
      <div className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-3 sm:space-y-4 lg:space-y-0">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-app flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            User Management
          </h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
            {/* View Mode Toggle — desktop only (mobile always uses cards) */}
            <div className="hidden lg:flex items-center space-x-2" role="group" aria-label="User list view">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                aria-pressed={viewMode === 'cards'}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'cards' ? 'bg-app-primary-soft text-app-primary' : 'text-app-muted hover:text-app'
                }`}
                title="Card View"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                aria-pressed={viewMode === 'table'}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-app-primary-soft text-app-primary' : 'text-app-muted hover:text-app'
                }`}
                title="Table View"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>

            <ExportMenu
              disabled={filteredAndSortedUsers.length === 0}
              exporting={exporting}
              onCustomize={() => setExportDialogOpen(true)}
              onExportExcel={() => runUserExport('excel')}
              onExportPdf={() => runUserExport('pdf')}
            />

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 sm:px-4 py-2 bg-app-primary text-app-on-primary hover:opacity-90 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--app-surface)] focus:ring-app-primary transition-all duration-300 text-xs sm:text-sm font-medium"
            >
              Add User
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 app-field border rounded-lg focus:outline-none text-xs sm:text-sm"
                aria-label="Search users"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 shrink-0">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="app-select w-full sm:w-auto sm:min-w-[150px] sm:max-w-[200px] px-2 sm:px-3 py-2 pr-9 border rounded-lg focus:outline-none text-xs sm:text-sm"
              aria-label="Filter by department"
            >
              <option value="all">All Departments</option>
              <option value="none">No Department</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="app-select w-full sm:w-auto px-2 sm:px-3 py-2 pr-9 border rounded-lg focus:outline-none text-xs sm:text-sm"
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="app-select w-full sm:w-auto px-2 sm:px-3 py-2 pr-9 border rounded-lg focus:outline-none text-xs sm:text-sm"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="app-select w-full sm:w-auto px-2 sm:px-3 py-2 pr-9 border rounded-lg focus:outline-none text-xs sm:text-sm"
              aria-label="Sort users"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="email-asc">Email A-Z</option>
              <option value="email-desc">Email Z-A</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-app-muted">
          <span>
            Showing {filteredAndSortedUsers.length} of {users.length} users
          </span>
          {(searchTerm ||
            filterRole !== 'all' ||
            filterDepartment !== 'all' ||
            filterStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterRole('all');
                setFilterDepartment('all');
                setFilterStatus('all');
              }}
              className="text-app-primary hover:opacity-80 transition-opacity"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm mb-4">
          {error}
        </div>
      )}

      {notice && (
        <div className="bg-app-primary-soft border border-app-primary/40 text-app-primary px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm mb-4">
          {notice}
        </div>
      )}

      {/* Content */}
      {filteredAndSortedUsers.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-app-muted text-4xl sm:text-6xl mb-4">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-app mb-2">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all' ? 'No users found' : 'No users found'}
          </h3>
          <p className="text-sm text-app-muted">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'No users have been created yet.'
            }
          </p>
        </div>
      ) : (
        <>
          {/* Card view: always on mobile/tablet; desktop when Cards is selected */}
          <div
            className={`${
              viewMode === 'cards' ? 'block' : 'block lg:hidden'
            } space-y-3 sm:space-y-4`}
          >
            {filteredAndSortedUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>

          {/* Table view: desktop only when Table is selected */}
          <div
            className={`${
              viewMode === 'table' ? 'hidden lg:block' : 'hidden'
            } overflow-x-auto rounded-xl border border-app bg-app-panel`}
          >
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-app bg-app-surface-2/60 text-left text-[11px] uppercase tracking-wide text-app-muted">
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap min-w-[160px]">User</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap min-w-[180px]">Email</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap min-w-[140px]">Department</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap w-[100px]">Role</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap w-[100px]">Status</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap w-[110px]">Created</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap text-right w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--app-border-subtle)]">
                {filteredAndSortedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-app-surface-2/50 transition-colors">
                    <td className="px-3 py-2.5 align-middle">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar user={user} size="sm" />
                        <span className="text-sm font-medium text-app truncate" title={user.name}>
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-middle max-w-[220px]">
                      <span className="text-[13px] text-app-muted truncate block" title={user.email}>
                        {user.email}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle max-w-[180px]">
                      <span className="text-[13px] text-app-soft truncate block" title={user.department || 'N/A'}>
                        {user.department || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-[11px] font-semibold rounded-lg border ${roleBadgeClass(user.role)}`}>
                        {formatRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-[11px] font-semibold rounded-lg border ${statusBadgeClass(user.isActive)}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap text-[11px] text-app-muted">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <div className="inline-flex items-center justify-end gap-1 w-full">
                        <button
                          type="button"
                          onClick={() => handleEditClick(user)}
                          disabled={isUserActionBusy(user.id)}
                          className="p-1.5 rounded-lg border border-app text-app-primary bg-app-primary-soft/60 hover:bg-app-primary-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit User"
                          aria-label={`Edit ${user.name}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          disabled={isUserActionBusy(user.id)}
                          className={`p-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.isActive
                              ? 'border-amber-500/30 text-amber-700 bg-amber-500/10 hover:bg-amber-500/20'
                              : 'border-app-primary/30 text-app-primary bg-app-primary-soft/60 hover:bg-app-primary-soft'
                          }`}
                          title={
                            togglingUserId === user.id
                              ? 'Updating…'
                              : user.isActive
                                ? 'Disable User'
                                : 'Enable User'
                          }
                          aria-label={
                            togglingUserId === user.id
                              ? `Updating ${user.name}`
                              : user.isActive
                                ? `Disable ${user.name}`
                                : `Enable ${user.name}`
                          }
                        >
                          {togglingUserId === user.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                          ) : user.isActive ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(user)}
                          disabled={isUserActionBusy(user.id)}
                          className="p-1.5 rounded-lg border border-rose-500/30 text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete User"
                          aria-label={`Delete ${user.name}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <DeleteUserModal
        open={Boolean(userToDelete)}
        user={userToDelete}
        deleting={deletingUser}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteUser}
      />

      {/* Edit User Modal */}
      <UserFormModal
        open={showEditModal}
        title="Edit User"
        submitLabel="Update User"
        submitLoadingLabel="Updating…"
        submitting={formSubmitting}
        onClose={() => {
          if (formSubmitting) return;
          setShowEditModal(false);
        }}
        onSubmit={handleEditSubmit}
      >
        <div>
          <label htmlFor="edit-name" className="block text-xs sm:text-sm font-medium text-app-soft">Name</label>
          <input
            type="text"
            id="edit-name"
            name="name"
            value={editFormData.name}
            onChange={handleEditChange}
            className="mt-1 block w-full app-field border rounded-xl shadow-sm py-2.5 px-3 focus:outline-none text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="edit-email" className="block text-xs sm:text-sm font-medium text-app-soft">Email</label>
          <input
            type="email"
            id="edit-email"
            name="email"
            value={editFormData.email}
            onChange={handleEditChange}
            className="mt-1 block w-full app-field border rounded-xl shadow-sm py-2.5 px-3 focus:outline-none text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="edit-designation" className="block text-xs sm:text-sm font-medium text-app-soft">Designation</label>
          <button
            type="button"
            id="edit-designation"
            onClick={() => setEditDesignationPickerOpen(true)}
            className={pickerTriggerClass}
            aria-haspopup="dialog"
            aria-expanded={editDesignationPickerOpen}
            title={editFormData.designation || undefined}
          >
            <span
              className={`min-w-0 truncate ${
                editFormData.designation ? 'text-app' : 'text-app-muted'
              }`}
            >
              {editFormData.designation || 'Select Designation'}
            </span>
            <svg className="h-4 w-4 flex-shrink-0 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div>
          <label htmlFor="edit-department" className="block text-xs sm:text-sm font-medium text-app-soft">Department</label>
          <button
            type="button"
            id="edit-department"
            onClick={() => setEditDepartmentPickerOpen(true)}
            className={pickerTriggerClass}
            aria-haspopup="dialog"
            aria-expanded={editDepartmentPickerOpen}
            title={editFormData.department || undefined}
          >
            <span
              className={`min-w-0 truncate ${
                editFormData.department ? 'text-app' : 'text-app-muted'
              }`}
            >
              {editFormData.department || 'Select Department'}
            </span>
            <svg className="h-4 w-4 flex-shrink-0 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div>
          <label htmlFor="edit-role" className="block text-xs sm:text-sm font-medium text-app-soft">Role</label>
          <select
            id="edit-role"
            name="role"
            value={editFormData.role}
            onChange={handleEditChange}
            className="mt-1 block w-full app-field border rounded-xl shadow-sm py-2.5 px-3 focus:outline-none text-sm"
          >
            {roles.map(role => (
              <option key={role} value={role} className="bg-app-panel">{role.charAt(0).toUpperCase() + role.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit-password" className="block text-xs sm:text-sm font-medium text-app-soft">
            New Password
          </label>
          <input
            type="password"
            id="edit-password"
            name="password"
            value={editFormData.password}
            onChange={handleEditChange}
            placeholder="Leave blank to keep current password"
            minLength={6}
            className="mt-1 block w-full app-field border rounded-xl shadow-sm py-2.5 px-3 focus:outline-none text-sm placeholder:text-app-muted"
          />
          <p className="mt-1 text-xs text-app-muted">
            Set a new password if the user forgot theirs (min. 6 characters).
          </p>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="edit-isActive"
            name="isActive"
            checked={editFormData.isActive}
            onChange={handleEditChange}
            className="h-4 w-4 text-app-primary focus:ring-app-primary border-app rounded bg-app-surface-2"
          />
          <label htmlFor="edit-isActive" className="ml-2 block text-xs sm:text-sm text-app-soft">Active</label>
        </div>
      </UserFormModal>

      {/* Add User Modal */}
      <UserFormModal
        open={showAddModal}
        title="Add New User"
        submitLabel="Add User"
        submitLoadingLabel="Adding…"
        submitting={formSubmitting}
        onClose={() => {
          if (formSubmitting) return;
          setShowAddModal(false);
        }}
        onSubmit={handleAddSubmit}
      >
        <div>
          <label htmlFor="add-name" className="block text-xs sm:text-sm font-medium text-app-soft">Name</label>
          <input
            type="text"
            id="add-name"
            name="name"
            value={addFormData.name}
            onChange={handleAddChange}
            className="mt-1 block w-full app-field border rounded-xl shadow-sm py-2.5 px-3 focus:outline-none text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="add-email" className="block text-xs sm:text-sm font-medium text-app-soft">Email</label>
          <input
            type="email"
            id="add-email"
            name="email"
            value={addFormData.email}
            onChange={handleAddChange}
            className="mt-1 block w-full app-field border rounded-xl shadow-sm py-2.5 px-3 focus:outline-none text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="add-password" className="block text-xs sm:text-sm font-medium text-app-soft">Password</label>
          <input
            type="password"
            id="add-password"
            name="password"
            value={addFormData.password}
            onChange={handleAddChange}
            className="mt-1 block w-full app-field border rounded-xl shadow-sm py-2.5 px-3 focus:outline-none text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="add-designation" className="block text-xs sm:text-sm font-medium text-app-soft">Designation</label>
          <button
            type="button"
            id="add-designation"
            onClick={() => setAddDesignationPickerOpen(true)}
            className={pickerTriggerClass}
            aria-haspopup="dialog"
            aria-expanded={addDesignationPickerOpen}
            title={addFormData.designation || undefined}
          >
            <span
              className={`min-w-0 truncate ${
                addFormData.designation ? 'text-app' : 'text-app-muted'
              }`}
            >
              {addFormData.designation || 'Select Designation'}
            </span>
            <svg className="h-4 w-4 flex-shrink-0 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div>
          <label htmlFor="add-department" className="block text-xs sm:text-sm font-medium text-app-soft">Department</label>
          <button
            type="button"
            id="add-department"
            onClick={() => setAddDepartmentPickerOpen(true)}
            className={pickerTriggerClass}
            aria-haspopup="dialog"
            aria-expanded={addDepartmentPickerOpen}
            title={addFormData.department || undefined}
          >
            <span
              className={`min-w-0 truncate ${
                addFormData.department ? 'text-app' : 'text-app-muted'
              }`}
            >
              {addFormData.department || 'Select Department'}
            </span>
            <svg className="h-4 w-4 flex-shrink-0 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <div>
          <label htmlFor="add-role" className="block text-xs sm:text-sm font-medium text-app-soft">Role</label>
          <select
            id="add-role"
            name="role"
            value={addFormData.role}
            onChange={handleAddChange}
            className="mt-1 block w-full app-field border rounded-xl shadow-sm py-2.5 px-3 focus:outline-none text-sm"
          >
            {roles.map(role => (
              <option key={role} value={role} className="bg-app-panel">{role.charAt(0).toUpperCase() + role.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="add-isActive"
            name="isActive"
            checked={addFormData.isActive}
            onChange={handleAddChange}
            className="h-4 w-4 text-app-primary focus:ring-app-primary border-app rounded bg-app-surface-2"
          />
          <label htmlFor="add-isActive" className="ml-2 block text-xs sm:text-sm text-app-soft">Active</label>
        </div>
      </UserFormModal>

      <OptionPickerModal
        open={editDesignationPickerOpen}
        title="Select designation"
        options={designations}
        selected={editFormData.designation}
        searchPlaceholder="Search designations…"
        emptyMessage="No designations match your search."
        allowClear
        clearLabel="Clear designation"
        onClose={() => setEditDesignationPickerOpen(false)}
        onSelect={(value) =>
          setEditFormData((prev) => ({ ...prev, designation: value }))
        }
      />
      <OptionPickerModal
        open={editDepartmentPickerOpen}
        title="Select department"
        options={departments}
        selected={editFormData.department}
        searchPlaceholder="Search departments…"
        emptyMessage="No departments match your search."
        allowClear
        clearLabel="Clear department"
        onClose={() => setEditDepartmentPickerOpen(false)}
        onSelect={(value) =>
          setEditFormData((prev) => ({ ...prev, department: value }))
        }
      />
      <OptionPickerModal
        open={addDesignationPickerOpen}
        title="Select designation"
        options={designations}
        selected={addFormData.designation}
        searchPlaceholder="Search designations…"
        emptyMessage="No designations match your search."
        allowClear
        clearLabel="Clear designation"
        onClose={() => setAddDesignationPickerOpen(false)}
        onSelect={(value) =>
          setAddFormData((prev) => ({ ...prev, designation: value }))
        }
      />
      <OptionPickerModal
        open={addDepartmentPickerOpen}
        title="Select department"
        options={departments}
        selected={addFormData.department}
        searchPlaceholder="Search departments…"
        emptyMessage="No departments match your search."
        allowClear
        clearLabel="Clear department"
        onClose={() => setAddDepartmentPickerOpen(false)}
        onSelect={(value) =>
          setAddFormData((prev) => ({ ...prev, department: value }))
        }
      />

      <ExportColumnDialog
        open={exportDialogOpen}
        titleId="user-export-columns"
        allColumnKeys={ALL_USER_EXPORT_COLUMN_KEYS}
        columnSections={USER_EXPORT_COLUMN_SECTIONS}
        filterSummary={buildUserFilterSummary()}
        exporting={exporting}
        onClose={() => setExportDialogOpen(false)}
        onExport={runUserExport}
      />
    </div>
  );
};

export default UserManagement;
