import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FPDC Helpdesk Enterprise IT Support',
  description:
    'Professional FPDC IT Support Ticketing System for efficient support management and issue resolution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-app-bg text-app`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname||'/';var darkOnly=p==='/'||p==='/login'||p==='/register'||p==='/auth'||p.indexOf('/auth/')===0;if(darkOnly){document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.removeProperty('--app-primary');document.documentElement.style.removeProperty('--app-primary-soft');document.documentElement.style.removeProperty('--app-primary-hover');document.documentElement.style.removeProperty('--app-on-primary');return;}var t=localStorage.getItem('helpdesk-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);var a=localStorage.getItem('helpdesk-accent');if(a){document.documentElement.style.setProperty('--app-primary',a);document.documentElement.style.setProperty('--app-primary-soft','color-mix(in srgb, '+a+' 14%, transparent)');document.documentElement.style.setProperty('--app-primary-hover','color-mix(in srgb, '+a+' 88%, black)');}}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
