'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hide header for authenticated users
  if (!mounted || currentUser) return null;

  return (
    <header className="bg-gray-900/90 backdrop-blur-md shadow-xl border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <div className="block">
                <span className="text-lg sm:text-xl font-bold text-white">FCDC</span>
                <p className="text-xs text-gray-400 -mt-1">Helpdesk Enterprise IT Support</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Only for non-authenticated users */}
          <nav className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-2 xl:space-x-3">
              {/* Sign In Button */}
              <Link 
                href="/auth" 
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-4 xl:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h7a3 3 0 713 3v1" />
                </svg>
                <span>Sign In</span>
              </Link>
              
              {/* Register Button */}
              <Link 
                href="/auth?register=true" 
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-4 xl:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Register</span>
              </Link>
            </div>
          </nav>

          {/* Mobile menu button - Only for non-authenticated users */}
          <div className="lg:hidden">
            <Link
              href="/auth"
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-base font-medium text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 transition-all duration-200 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 713-3h7a3 3 0 713 3v1" />
              </svg>
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
