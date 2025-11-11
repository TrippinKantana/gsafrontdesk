import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { Footer } from '@/components/footer';

const rubik = Rubik({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Syncco Visitor Management',
  description: 'Visitor management system for government and enterprise offices',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Syncco',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' as const,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icon-192.png" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="Syncco" />
        </head>
        <body className={rubik.className + " flex flex-col min-h-screen"}>
          <Providers>
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Toaster />
            <PWAInstallPrompt />
            <Footer />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/sw.js')
                        .then(function(registration) {
                          console.log('SW registered:', registration);
                        })
                        .catch(function(error) {
                          console.log('SW registration failed:', error);
                        });
                    });
                  }
                `,
              }}
            />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
