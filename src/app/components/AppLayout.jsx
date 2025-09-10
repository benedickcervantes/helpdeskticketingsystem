'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';

const AppLayout = ({ children }) => {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Show sidebar only for authenticated users
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar - Always visible for authenticated users */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-64 ml-16 transition-all duration-300 ease-in-out">
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Content with responsive padding */}
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
