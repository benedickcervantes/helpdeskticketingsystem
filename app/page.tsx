// @ts-nocheck
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { TechNewsSkeleton } from '@/lib/ui/DashboardSkeletons';
import AppShell from '@/shell/layout/AppShell';
import Footer from '@/shell/layout/Footer';
import Link from 'next/link';
import { getDashboardPath } from '@/lib/utils/roles';

const TechNewsSection = dynamic(() => import('@/lib/ui/TechNewsSection'), {
  loading: () => (
    <div className="relative w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-gray-900 to-gray-900 pointer-events-none" />
      <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 space-y-8">
        <div className="space-y-4 max-w-2xl">
          <div className="h-10 w-10 rounded-xl bg-gray-800 skeleton-shimmer" />
          <div className="h-10 w-72 max-w-full rounded-lg bg-gray-800 skeleton-shimmer" />
          <div className="h-4 w-96 max-w-full rounded bg-gray-800/70 skeleton-shimmer" />
          <div className="h-11 w-36 rounded-lg bg-gray-800 skeleton-shimmer" />
        </div>
        <TechNewsSkeleton count={3} />
      </div>
    </div>
  ),
});

function LandingSkeleton() {
  return (
    <>
      <AppShell>
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-8 sm:space-y-10 overflow-x-hidden">
          <div className="space-y-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gray-800 skeleton-shimmer" />
            <div className="h-8 sm:h-10 w-48 sm:w-72 max-w-full rounded-lg bg-gray-800 skeleton-shimmer" />
            <div className="h-4 w-full max-w-sm rounded bg-gray-800/70 skeleton-shimmer" />
            <div className="h-11 w-full max-w-[10rem] rounded-lg bg-gray-800 skeleton-shimmer" />
          </div>
          <TechNewsSkeleton count={2} className="sm:hidden" />
          <TechNewsSkeleton count={3} className="hidden sm:flex" />
          <div className="grid grid-cols-1 gap-4 pt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 sm:h-36 rounded-xl border border-gray-700/50 bg-gray-800/50 skeleton-shimmer"
              />
            ))}
          </div>
        </div>
      </AppShell>
      <Footer />
    </>
  );
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Submit a ticket',
    description:
      'Describe the issue, pick a category, and send it to the FPDC IT team in a few clicks.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    ),
  },
  {
    step: '02',
    title: 'Track progress',
    description:
      'Follow status updates and conversation replies as your request moves through the queue.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    ),
  },
  {
    step: '03',
    title: 'Get it resolved',
    description:
      'IT closes the loop when the fix is done — and you can leave feedback on the support you received.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
];

const FEATURES = [
  {
    title: 'Smart Ticketing',
    description:
      'Create, prioritize, and route requests so the right IT staff can act quickly.',
    accent: 'emerald',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
  },
  {
    title: 'Real-time Updates',
    description:
      'Stay informed with live notifications when your ticket status or replies change.',
    accent: 'cyan',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
  },
  {
    title: 'Role-based Access',
    description:
      'Users, admins, and management each see the tools and views that match their role.',
    accent: 'emerald',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
      />
    ),
  },
];

export default function HomePage() {
  const { currentUser, userProfile, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return <LandingSkeleton />;
  }

  const dashboardPath = currentUser ? getDashboardPath(userProfile?.role) : '/auth';
  const ctaLabel = currentUser ? 'Go to Dashboard' : 'Get Started';

  return (
    <>
      <AppShell>
        {/* Hero — FPDC Helpdesk + tech news */}
        <div className="relative overflow-x-hidden">
          <TechNewsSection ctaHref={dashboardPath} ctaLabel={ctaLabel} />
        </div>

        {/* How it works */}
        <section id="how-it-works" className="py-10 sm:py-14 md:py-20 bg-gradient-to-b from-gray-900 to-gray-800 relative scroll-mt-16 sm:scroll-mt-20">
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-10 md:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 break-words px-1">
                How the helpdesk works
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto px-1">
                Three steps from issue to resolution — built for FPDC employees and IT support.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.step} className="relative text-center md:text-left px-1">
                  <div className="inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 mb-3 sm:mb-4">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {item.icon}
                    </svg>
                  </div>
                  <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-emerald-400/80 mb-1.5 sm:mb-2">
                    STEP {item.step}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-1.5 sm:mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features — 3 honest capabilities */}
        <section id="features" className="py-10 sm:py-14 md:py-20 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 relative overflow-hidden scroll-mt-16 sm:scroll-mt-20">
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255, 255, 255, 0.08) 2px, transparent 2px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-8 sm:mb-10 md:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 break-words px-1">
                Built for FPDC IT support
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto px-1">
                Practical tools to submit requests, stay updated, and work with the right access for your role.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {FEATURES.map((feature) => {
                const isCyan = feature.accent === 'cyan';
                return (
                  <div
                    key={feature.title}
                    className={`rounded-2xl border p-4 sm:p-6 md:p-7 bg-gray-900/60 border-gray-700/60 transition-colors duration-200 ${
                      isCyan
                        ? 'hover:border-cyan-500/40'
                        : 'hover:border-emerald-500/40'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5 ${
                        isCyan ? 'bg-cyan-500/20' : 'bg-emerald-500/20'
                      }`}
                    >
                      <svg
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${isCyan ? 'text-cyan-400' : 'text-emerald-400'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {feature.icon}
                      </svg>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* IT Basics — compact tutorial */}
        <section id="it-basics" className="py-10 sm:py-12 md:py-16 bg-gradient-to-r from-gray-800 to-gray-900 relative overflow-hidden scroll-mt-16 sm:scroll-mt-20">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(22, 54, 90, 0.35) 2px, transparent 2px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div className="max-w-3xl mx-auto text-center px-3 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 break-words">
              Brush up on IT basics
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-xl mx-auto">
              Short video lessons on hardware, software, networking, and security — useful whether you
              are reporting an issue or supporting one.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a
                href="https://www.youtube.com/playlist?list=PL4316FC411AD077AA"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex w-full sm:w-auto min-h-11 items-center justify-center gap-2 sm:gap-3 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span className="truncate">Watch Tutorial Series</span>
                <svg
                  className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              <Link
                href={dashboardPath}
                className="group inline-flex w-full sm:w-auto min-h-11 items-center justify-center gap-2 sm:gap-3 border-2 border-gray-600 hover:border-emerald-500 hover:bg-emerald-500/10 text-white px-4 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <span>{ctaLabel}</span>
                <svg
                  className="w-4 h-4 shrink-0 group-hover:translate-x-0.5 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-10 sm:py-14 md:py-16 bg-gray-950">
          <div className="max-w-3xl mx-auto text-center px-3 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 break-words">
              {currentUser ? 'Ready to continue?' : 'Need IT help?'}
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 px-1">
              {currentUser
                ? 'Open your dashboard to submit tickets, check updates, or manage requests.'
                : 'Sign in to the FPDC Helpdesk to submit a ticket and track your request.'}
            </p>
            <Link
              href={dashboardPath}
              className="inline-flex w-full sm:w-auto min-h-11 items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold shadow-lg shadow-emerald-900/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <span>{ctaLabel}</span>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </AppShell>
      <Footer />
    </>
  );
}
