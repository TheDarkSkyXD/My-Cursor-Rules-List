import 'dotenv/config'; // Load environment variables
import type { Metadata } from 'next'
import "@/app/globals.css"
import { cn } from "@/lib/utils"
import { fontSans } from "@/lib/fonts"
import { RootClientLayout } from "@/components/layout/root-client-layout"

export const metadata: Metadata = {
  title: "MealTime - Gerenciador de Alimentação",
  description: "Gerencie a alimentação dos seus gatos de forma simples e eficiente",
  generator: 'MealTime App',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MealTime',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="hsl(221.2, 83.2%, 53.3%)" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <RootClientLayout>
          {children}
        </RootClientLayout>
        <script src="/register-sw.js" />
      </body>
    </html>
  )
}