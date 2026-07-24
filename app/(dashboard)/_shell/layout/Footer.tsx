// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { FpdcLogo } from '@/lib/ui/FpdcLogo';
import { getDashboardPath } from '@/lib/utils/roles';

const LEGAL_CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    body: `FPDC Helpdesk Ticketing System - Privacy Policy

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

Contact the FPDC IT Department for privacy-related requests.`,
  },
  terms: {
    title: 'Terms of Service',
    body: `FPDC Helpdesk Ticketing System - Terms of Service

Last Updated: January 2025

1. ACCEPTANCE OF TERMS
By accessing and using the FPDC Helpdesk Ticketing System, you agree to be bound by these Terms of Service.

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
• Tickets are processed during business hours
• Emergency tickets are handled according to IT priority
• Response times vary by priority level
• Users are responsible for providing necessary information

5. SYSTEM AVAILABILITY
• Scheduled maintenance will be announced in advance
• No guarantee of uninterrupted service
• Backup procedures are in place

6. LIABILITY
• FPDC is not liable for indirect damages
• Users are responsible for data backup
• System downtime does not constitute breach of contract

7. MODIFICATIONS
• Terms may be updated with notice
• Continued use constitutes acceptance
• Major changes will be communicated to users

Contact the FPDC IT Department for questions about these terms.`,
  },
  cookies: {
    title: 'Cookie Policy',
    body: `FPDC Helpdesk Ticketing System - Cookie Policy

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

3. COOKIE MANAGEMENT
• You can control cookies through browser settings
• Disabling essential cookies will prevent system access
• Functional cookies can be disabled without major impact

4. THIRD-PARTY COOKIES
• Authentication provider cookies as required for sign-in
• No advertising or tracking cookies used

5. COOKIE RETENTION
• Session cookies: Deleted when browser closes
• Authentication cookies: per provider policy
• Preference cookies: up to 1 year

Contact the FPDC IT Department for privacy-related requests.`,
  },
  contact: {
    title: 'Contact IT Support',
    body: `Need help from the FPDC IT team?

The fastest way to get support is through this helpdesk:
• Sign in and submit a support ticket
• Track progress and reply in the ticket conversation
• Leave feedback after your request is resolved

For company updates and announcements, follow Federal Pioneer Development Corp. on Facebook.

If you cannot access the system, contact your department head or the on-site IT staff.`,
    ctaLabel: 'Open helpdesk',
  },
};

function FooterNavLink({ href, icon, title, description, onClick }) {
  const className =
    'group flex items-start gap-2.5 sm:gap-3 w-full rounded-xl px-2 sm:px-3 py-2.5 text-left border border-transparent hover:border-gray-800 hover:bg-gray-900/80 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 min-h-11';

  const content = (
    <>
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 border border-gray-800 text-gray-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
          {title}
        </span>
        {description ? (
          <span className="block text-xs text-gray-500 mt-0.5 leading-snug break-words">
            {description}
          </span>
        ) : null}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

const ICON = {
  home: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  ),
  steps: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  news: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  learn: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  dashboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  ticket: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  list: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  support: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  doc: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  cookie: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
};

const Footer = () => {
  const [mounted, setMounted] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const pathname = usePathname();
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setActiveModal(null);
    };

    if (activeModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [activeModal]);

  if (!mounted) return null;
  if (currentUser && pathname !== '/') return null;

  const dashboardPath = currentUser ? getDashboardPath(userProfile?.role) : '/auth';
  const createTicketHref = currentUser ? `${dashboardPath}?tab=create` : '/auth';
  const ticketsHref = currentUser ? `${dashboardPath}?tab=tickets` : '/auth';
  const modal = activeModal ? LEGAL_CONTENT[activeModal] : null;
  const modalCtaHref = createTicketHref;

  const quickLinks = [
    {
      href: '/',
      icon: ICON.home,
      title: 'Home',
      description: 'Back to the landing page',
    },
    {
      href: '/#how-it-works',
      icon: ICON.steps,
      title: 'How it works',
      description: 'Submit, track, and resolve',
    },
    {
      href: '/#tech-news',
      icon: ICON.news,
      title: 'Tech news',
      description: 'Latest IT trends and tools',
    },
    {
      href: '/#it-basics',
      icon: ICON.learn,
      title: 'IT basics',
      description: 'Short tutorials for beginners',
    },
    {
      href: dashboardPath,
      icon: ICON.dashboard,
      title: currentUser ? 'Dashboard' : 'Sign in',
      description: currentUser ? 'Open your helpdesk workspace' : 'Access your FPDC account',
    },
  ];

  const supportActions = [
    {
      href: createTicketHref,
      icon: ICON.ticket,
      title: 'Create ticket',
      description: currentUser ? 'Report a new IT issue' : 'Sign in to submit a request',
    },
    {
      href: ticketsHref,
      icon: ICON.list,
      title: 'My tickets',
      description: currentUser ? 'View and track your requests' : 'Sign in to see your tickets',
    },
    {
      onClick: () => setActiveModal('contact'),
      icon: ICON.support,
      title: 'Contact IT support',
      description: 'How to reach the FPDC IT team',
    },
    {
      onClick: () => setActiveModal('privacy'),
      icon: ICON.shield,
      title: 'Privacy policy',
      description: 'How we handle your data',
    },
    {
      onClick: () => setActiveModal('terms'),
      icon: ICON.doc,
      title: 'Terms of service',
      description: 'Rules for using the helpdesk',
    },
    {
      onClick: () => setActiveModal('cookies'),
      icon: ICON.cookie,
      title: 'Cookie policy',
      description: 'Cookies used by this system',
    },
  ];

  return (
    <>
      <footer className="bg-gray-950 text-white border-t border-gray-800/80 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-10 sm:py-12 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-5 min-w-0">
              <Link href="/" className="inline-flex items-center gap-2.5 sm:gap-3 group min-w-0">
                <FpdcLogo size="md" className="sm:hidden shrink-0" />
                <FpdcLogo size="lg" className="hidden sm:block shrink-0" />
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-200 transition-colors">
                    FPDC
                  </p>
                  <p className="text-xs text-gray-400 -mt-0.5">IT Helpdesk</p>
                </div>
              </Link>
              <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                Internal IT support for Federal Pioneer Development Corp. — submit tickets, track
                progress, and resolve issues with the IT team.
              </p>
              <a
                href="https://www.facebook.com/FederalPioneerDevelopmentCorp/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors max-w-full"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 border border-gray-800">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </span>
                <span className="truncate">Follow FPDC on Facebook</span>
              </a>
            </div>

            {/* Quick links */}
            <div className="lg:col-span-4 min-w-0">
              <div className="mb-2 sm:mb-3 px-2 sm:px-3">
                <h3 className="text-sm font-semibold text-white tracking-wide">Quick links</h3>
                <p className="text-xs text-gray-500 mt-1">Navigate the helpdesk and landing page</p>
              </div>
              <ul className="space-y-0.5 sm:space-y-1">
                {quickLinks.map((item) => (
                  <li key={item.title}>
                    <FooterNavLink
                      href={item.href}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div className="lg:col-span-4 min-w-0">
              <div className="mb-2 sm:mb-3 px-2 sm:px-3">
                <h3 className="text-sm font-semibold text-white tracking-wide">Support</h3>
                <p className="text-xs text-gray-500 mt-1">Get help and review system policies</p>
              </div>

              <div className="mx-1 sm:mx-3 mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 sm:p-3.5">
                <p className="text-sm font-medium text-emerald-200">Need IT help now?</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Submit a ticket in the helpdesk — the fastest way to reach the FPDC IT team.
                </p>
                <Link
                  href={createTicketHref}
                  className="mt-3 inline-flex w-full sm:w-auto min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors"
                >
                  <span className="truncate">{currentUser ? 'Create a ticket' : 'Sign in to get help'}</span>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <ul className="space-y-0.5 sm:space-y-1">
                {supportActions.map((item) => (
                  <li key={item.title}>
                    <FooterNavLink
                      href={item.href}
                      onClick={item.onClick}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 sm:mt-10 pt-5 sm:pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
              © {new Date().getFullYear()} Federal Pioneer Development Corp. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs sm:text-sm">FPDC IT Helpdesk</p>
          </div>
        </div>
      </footer>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-modal-title"
            className="bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-700 w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 id="footer-modal-title" className="text-lg font-semibold text-white">
                {modal.title}
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
              <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed font-sans">
                {modal.body}
              </pre>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 py-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              {modal.ctaLabel && (
                <Link
                  href={modalCtaHref}
                  onClick={() => setActiveModal(null)}
                  className="inline-flex items-center justify-center px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {currentUser ? 'Create a ticket' : modal.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;
