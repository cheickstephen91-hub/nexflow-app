'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@/contexts/theme-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
