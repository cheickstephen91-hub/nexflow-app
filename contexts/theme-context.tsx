'use client'

/**
 * Thin wrapper over next-themes.
 * Tous les composants qui importent useTheme / ThemeProvider depuis ici
 * continuent de fonctionner sans modification.
 */

import { useTheme as useNextTheme } from 'next-themes'

export function useTheme() {
  const { resolvedTheme, setTheme } = useNextTheme()
  const isDark = resolvedTheme === 'dark'
  return {
    isDark,
    theme: (resolvedTheme ?? 'light') as 'light' | 'dark',
    toggleTheme: () => setTheme(isDark ? 'light' : 'dark'),
  }
}

export { ThemeProvider } from 'next-themes'
