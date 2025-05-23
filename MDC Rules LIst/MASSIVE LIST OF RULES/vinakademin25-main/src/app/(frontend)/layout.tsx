import './globals.css'
import React from 'react'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  description: 'Vinakademin - Din guide till vinets värld',
  title: 'Vinakademin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
