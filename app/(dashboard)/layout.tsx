'use client';

import type { ReactNode } from 'react';
import AppShell from '@/shell/layout/AppShell';
import Footer from '@/shell/layout/Footer';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <AppShell>{children}</AppShell>
      </div>
      <Footer />
    </div>
  );
}
