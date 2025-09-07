'use client';

import { useState, useEffect } from 'react';
import { db } from '../firebaseconfig';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth'; // For creating new users in Auth
import { auth } from '../firebaseconfig'; // Import auth instance

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    department: '',
    role: 'user',
    isActive: true,
  });
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: 'user',
    isActive: true,
  });

  const departments = ['IT', 'HR', 'Finance', 'Marketing', 'Sales', 'Operations', 'Customer Support', 'Other'];
  const roles = ['user', 'admin'];

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please check your permissions.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      department: user.department || '',
      role: user.role,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        name: editFormData.name,
        email: editFormData.email, // Note: Changing email here won't change Firebase Auth email
        department: editFormData.department,
        role: editFormData.role,
        isActive: editFormData.isActive,
        updatedAt: serverTimestamp(),
      });
      setShowEditModal(false);
      alert('User updated successfully!');
    } catch (err) {
      console.error('Error updating user:', err);
      setError(`Failed to update user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, addFormData.email, addFormData.password);
      const uid = userCredential.user.uid;

      // 2. Add user profile to Firestore
      await addDoc(collection(db, 'users'), { // Changed to addDoc to let Firestore generate ID, then update with UID
        uid: uid,
        name: addFormData.name,
        email: addFormData.email,
        department: addFormData.department,
        role: addFormData.role,
        isActive: addFormData.isActive,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(), // Set initial last login
      });

      setShowAddModal(false);
      setAddFormData({
        name: '',
        email: '',
        password: '',
        department: '',
        role: 'user',
        isActive: true,
      });
      alert('User added successfully!');
    } catch (err) {
      console.error('Error adding user:', err);
      setError(`Failed to add user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setLoading(true);
      setError('');
      try {
        // Note: This only deletes the Firestore document.
        // To delete the Firebase Auth user, you'd need a Cloud Function or Admin SDK.
        await deleteDoc(doc(db, 'users', userId));
        alert('User deleted successfully!');
      } catch (err) {
        console.error('Error deleting user:', err);
        setError(`Failed to delete user: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleActive = async (user) => {
    setLoading(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isActive: !user.isActive,
        updatedAt: serverTimestamp(),
      });
      alert(`User ${user.isActive ? 'disabled' : 'enabled'} successfully!`);
    } catch (err) {
      console.error('Error toggling user status:', err);
      setError(`Failed to toggle user status: ${err.message}`);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-200 text-slate-700 font-medium">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">
                    {user.department || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-cyan-100 text-cyan-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="text-emerald-600 hover:text-emerald-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(user)}
                    className={`mr-3 ${user.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-emerald-600 hover:text-emerald-900'}`}
                  >
                    {user.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Edit User</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-department" className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  id="edit-department"
                  name="department"
                  value={editFormData.department}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  id="edit-role"
                  name="role"
                  value={editFormData.role}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-isActive"
                  name="isActive"
                  checked={editFormData.isActive}
                  onChange={handleEditChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-isActive" className="ml-2 block text-sm text-gray-900">Active</label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Add New User</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label htmlFor="add-name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="add-name"
                  name="name"
                  value={addFormData.name}
                  onChange={handleAddChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="add-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  id="add-email"
                  name="email"
                  value={addFormData.email}
                  onChange={handleAddChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="add-password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  id="add-password"
                  name="password"
                  value={addFormData.password}
                  onChange={handleAddChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="add-department" className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  id="add-department"
                  name="department"
                  value={addFormData.department}
                  onChange={handleAddChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="add-role" className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  id="add-role"
                  name="role"
                  value={addFormData.role}
                  onChange={handleAddChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
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
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="add-isActive" className="ml-2 block text-sm text-gray-900">Active</label>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
