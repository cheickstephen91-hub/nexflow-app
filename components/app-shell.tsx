'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'

const PUBLIC_ROUTES = ['/login', '/onboarding', '/activer-compte']

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Desktop sidebar (fixed) ── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-60 z-20 flex-col shadow-xl"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <Sidebar />
      </aside>

      {/* ── Mobile sidebar (overlay) ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="fixed left-0 top-0 h-full w-60 z-40 flex flex-col shadow-2xl md:hidden">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Mobile top bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-10 md:hidden flex items-center gap-3 px-4 py-3 border-b"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-all"
          aria-label="Ouvrir le menu"
        >
          <svg className="w-5 h-5" style={{ color: 'var(--text-primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="flex items-baseline gap-0.5">
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Nex</span>
          <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>flow</span>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {children}
      </main>
    </div>
  )
}
