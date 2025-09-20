'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

const Footer = () => {
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const pathname = usePathname();
  const { currentUser } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Force re-render when pathname changes
  useEffect(() => {
    // This ensures the footer updates when the route changes
  }, [pathname]);

  // Close modal when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
      }
    };

    if (activeModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [activeModal]);

  // Social Media Functions
  const handleFacebookClick = () => {
    window.open("https://www.facebook.com/FederalPioneerDevelopmentCorp/", "_blank", "noopener,noreferrer");
  };

  const handleLinkedInClick = () => {
    alert("LinkedIn account is coming soon! Stay tuned for updates from Federal Pioneer Development Corp.");
  };

  const handleTwitterClick = () => {
    alert("Twitter account is coming soon! Follow us for the latest updates from Federal Pioneer Development Corp.");
  };

  // Hide footer for authenticated users
  if (!mounted || currentUser) return null;

  if (!mounted) {
    return (
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/4 mx-auto mb-4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Modal component for legal policies
  const LegalModal = ({ title, content, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">
                {content}
              </pre>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="flex justify-end p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">FCDC</span>
                  <p className="text-xs text-gray-400 -mt-1">Helpdesk Enterprise IT Support</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                Professional FCDC IT Support Ticketing System for efficient support management and issue resolution. 
                Streamline your IT operations with our advanced platform.
              </p>
              <div className="flex space-x-4">
                <button onClick={handleFacebookClick} className="text-gray-500 hover:text-emerald-400 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                  <span className="sr-only">Facebook</span>
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-emerald-500/10 transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                </button>
                <button onClick={handleTwitterClick} className="text-gray-500 hover:text-cyan-400 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                  <span className="sr-only">Twitter</span>
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-cyan-500/10 transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                </button>
                <button onClick={handleLinkedInClick} className="text-gray-500 hover:text-blue-400 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                  <span className="sr-only">LinkedIn</span>
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-500/10 transition-colors">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/user" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 flex items-center group">
                    <svg className="w-4 h-4 mr-2 text-gray-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/user?tab=create" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 flex items-center group">
                    <svg className="w-4 h-4 mr-2 text-gray-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Ticket
                  </Link>
                </li>
                <li>
                  <Link href="/user?tab=tickets" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 flex items-center group">
                    <svg className="w-4 h-4 mr-2 text-gray-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    My Tickets
                  </Link>
                </li>
                <li>
                  <Link href="/auth" className="text-gray-400 hover:text-emerald-400 transition-colors duration-300 flex items-center group">
                    <svg className="w-4 h-4 mr-2 text-gray-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
                <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
                Support
              </h3>
              <ul className="space-y-3">
                <li>
                  <button 
                    onClick={() => {
                      const helpSection = document.getElementById('help-section');
                      if (helpSection) {
                        helpSection.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        alert('FCDC Help Center\n\nFor technical support:\n• Create a support ticket\n• Contact IT Department\n• Check system status\n\nPhone: (555) 123-4567\nEmail: support@fcdc.com');
                      }
                    }}
                    className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 flex items-center group cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-2 text-gray-600 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      alert('FCDC Contact Information\n\nIT Support Department\nPhone: (555) 123-4567\nEmail: support@fcdc.com\n\nBusiness Hours:\nMonday - Friday: 8:00 AM - 6:00 PM\nSaturday: 9:00 AM - 1:00 PM\n\nEmergency Support:\n24/7 Hotline: (555) 911-HELP');
                    }}
                    className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 flex items-center group cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-2 text-gray-600 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm">
                © 2025 FCDC. All rights reserved.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 md:mt-0 justify-center md:justify-end">
                <button 
                  onClick={() => setActiveModal('privacy')}
                  className="text-gray-500 hover:text-emerald-400 text-sm transition-colors duration-300 flex items-center group cursor-pointer"
                >
                  <svg className="w-3 h-3 mr-1 text-gray-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Privacy Policy
                </button>
                <button 
                  onClick={() => setActiveModal('terms')}
                  className="text-gray-500 hover:text-emerald-400 text-sm transition-colors duration-300 flex items-center group cursor-pointer"
                >
                  <svg className="w-3 h-3 mr-1 text-gray-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Terms of Service
                </button>
                <button 
                  onClick={() => setActiveModal('cookies')}
                  className="text-gray-500 hover:text-emerald-400 text-sm transition-colors duration-300 flex items-center group cursor-pointer"
                >
                  <svg className="w-3 h-3 mr-1 text-gray-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Cookie Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Policy Modals */}
      <LegalModal
        title="Privacy Policy"
        content={`FCDC Helpdesk Ticketing System - Privacy Policy

Last Updated: January 2025

1. INFORMATION WE COLLECT
• User account information (name, email, department)
• Support ticket data and communications
• System usage analytics and performance metrics
• Device and browser information for technical support

2. HOW WE USE YOUR INFORMATION
• Process and manage support tickets
• Provide technical assistance and system maintenance
• Generate reports and analytics for system improvement
• Communicate important system updates and notifications

3. DATA SECURITY
• All data is encrypted in transit and at rest
• Access is restricted to authorized personnel only
• Regular security audits and compliance monitoring
• Data backup and disaster recovery procedures

4. DATA RETENTION
• Support tickets: Retained for 7 years for audit purposes
• User accounts: Active while employed, archived after departure
• System logs: Retained for 1 year for troubleshooting

5. YOUR RIGHTS
• Access your personal data
• Request data correction or deletion
• Opt-out of non-essential communications
• File complaints with our Data Protection Officer

Contact: privacy@fcdc.com | (555) 123-4567`}
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
      />

      <LegalModal
        title="Terms of Service"
        content={`FCDC Helpdesk Ticketing System - Terms of Service

Last Updated: January 2025

1. ACCEPTANCE OF TERMS
By accessing and using the FCDC Helpdesk Ticketing System, you agree to be bound by these Terms of Service.

2. SYSTEM USAGE
• Use the system only for legitimate IT support requests
• Provide accurate and complete information in tickets
• Respect other users and support staff
• Follow company IT policies and procedures

3. PROHIBITED ACTIVITIES
• Submitting false or misleading information
• Attempting to gain unauthorized access
• Using the system for non-business purposes
• Harassment or inappropriate behavior

4. TICKET MANAGEMENT
• Tickets are processed during business hours (8 AM - 6 PM)
• Emergency tickets are handled 24/7
• Response times vary by priority level
• Users are responsible for providing necessary information

5. SYSTEM AVAILABILITY
• We strive for 99.9% uptime
• Scheduled maintenance will be announced in advance
• No guarantee of uninterrupted service
• Backup procedures are in place

6. LIABILITY
• FCDC is not liable for indirect damages
• Users are responsible for data backup
• System downtime does not constitute breach of contract

7. MODIFICATIONS
• Terms may be updated with 30 days notice
• Continued use constitutes acceptance
• Major changes will be communicated via email

Contact: legal@fcdc.com | (555) 123-4567`}
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
      />

      <LegalModal
        title="Cookie Policy"
        content={`FCDC Helpdesk Ticketing System - Cookie Policy

Last Updated: January 2025

1. WHAT ARE COOKIES
Cookies are small text files stored on your device to enhance your experience with our helpdesk system.

2. TYPES OF COOKIES WE USE

ESSENTIAL COOKIES (Required)
• Authentication cookies for secure login
• Session cookies for ticket management
• Security cookies for fraud prevention
• These cannot be disabled as they are necessary for system function

FUNCTIONAL COOKIES (Optional)
• User preference settings
• Language and theme selections
• Dashboard layout preferences
• Can be disabled but may affect user experience

ANALYTICS COOKIES (Optional)
• System performance monitoring
• Usage statistics for improvement
• Error tracking and debugging
• Help us optimize the system

3. COOKIE MANAGEMENT
• You can control cookies through browser settings
• Disabling essential cookies will prevent system access
• Functional cookies can be disabled without major impact
• Analytics cookies are optional and can be turned off

4. THIRD-PARTY COOKIES
• Firebase authentication cookies
• Google Analytics (if enabled)
• No advertising or tracking cookies used

5. COOKIE RETENTION
• Session cookies: Deleted when browser closes
• Authentication cookies: 30 days
• Preference cookies: 1 year
• Analytics cookies: 2 years

6. YOUR CHOICES
• Accept all cookies (recommended)
• Accept only essential cookies
• Customize cookie preferences
• Clear cookies at any time

Contact: privacy@fcdc.com | (555) 123-4567`}
        isOpen={activeModal === 'cookies'}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
};

export default Footer;
