import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '../components/theme-provider';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CollabX - Real-time Collaborative Code Editor',
  description: 'A modern, real-time collaborative code editor for seamless coding sessions.',
  keywords: 'collaborative editor, code editor, real-time collaboration, pair programming, code sharing',
  authors: [{ name: 'CollabX Team' }],
  creator: 'CollabX',
  publisher: 'CollabX',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://collabx.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'CollabX - Real-time Collaborative Code Editor',
    description: 'A modern, real-time collaborative code editor for seamless coding sessions.',
    url: 'https://collabx.app',
    siteName: 'CollabX',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CollabX - Real-time Collaborative Code Editor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CollabX - Real-time Collaborative Code Editor',
    description: 'A modern, real-time collaborative code editor for seamless coding sessions.',
    images: ['/og-image.png'],
    creator: '@collabx',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  category: 'Technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster position="bottom-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
