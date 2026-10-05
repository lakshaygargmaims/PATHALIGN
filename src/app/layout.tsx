import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/toast';

export const metadata: Metadata = {
  title: {
    default: 'PATHALIGN AI — Aligning Dreams with Opportunities',
    template: '%s · PATHALIGN AI',
  },
  description:
    'AI-powered vocational career counselling and family decision support for students, parents, counsellors and administrators.',
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#102B46',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-sans">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
