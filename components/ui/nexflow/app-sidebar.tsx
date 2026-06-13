'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/theme-context'
import { NexflowLogo } from './nexflow-logo'
import { UserAvatar } from './user-avatar'

/* ─────────────────────────────────────────────────────────
   AppSidebar — Nexflow v2
   Remplace components/sidebar.tsx lors de la migration.

   Props:
     onClose  () => void  — bouton fermeture (mobile drawer)
───────────────────────────────────────────────────────── */

interface AppSidebarProps {
  onClose?: () => void
}

/* ── Icônes nav ── */
const IcoHome = <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoPlus = <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
const IcoDash = <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
const IcoTeam = <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const IcoSettings = <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const IcoHelp = <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const IcoMoon = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
const IcoSun  = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
const IcoLogout = <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IcoClose = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>

/* ── Labels rôles ── */
const ROLE_LABEL: Record<string, string> = {
  directeur:    'Directeur',
  manager:      'Manager',
  collaborateur:'Collaborateur',
}

/* ── NavItem ── */
function NavItem({
  href, label, icon, active, delay,
}: {
  href: string; label: string; icon: React.ReactNode
  active: boolean; delay: number
}) {
  return (
    <Link
      href={href}
      className="sidebar-item-animate flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
      style={{
        animationDelay: `${delay}ms`,
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
        color:      active ? '#ffffff' : 'var(--sidebar-muted)',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--sidebar-hover)'
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
      }}
    >
      {/* Active: icône blanche */}
      <span style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.55)' }}>
        {icon}
      </span>
      <span style={{ color: active ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>
        {label}
      </span>
      {active && (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--primary)' }}
        />
      )}
    </Link>
  )
}

/* ── ThemeToggle ── */
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-3">
        <span style={{ color: 'rgba(255,255,255,0.55)' }}>
          {isDark ? IcoSun : IcoMoon}
        </span>
        <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Mode {isDark ? 'clair' : 'sombre'}
        </span>
      </div>
      {/* Toggle switch */}
      <button
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDark}
        className="relative w-10 h-5.5 rounded-full transition-colors duration-300 shrink-0"
        style={{
          width:      40,
          height:     22,
          background: isDark ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-transform duration-300"
          style={{
            width:      18,
            height:     18,
            background: '#ffffff',
            transform:  `translateX(${isDark ? 20 : 2}px)`,
          }}
        />
      </button>
    </div>
  )
}

/* ── Main component ── */
export function AppSidebar({ onClose }: AppSidebarProps) {
  const { data: session } = useSession()
  const pathname          = usePathname()

  const role        = (session as { role?: string } | null)?.role ?? 'collaborateur'
  const isDirecteur = role === 'directeur'
  const isManager   = role === 'manager'

  const navItems = [
    { href: '/',                label: 'Accueil',         icon: IcoHome,     show: true },
    { href: '/nouvelle-fiche',  label: 'Nouvelle fiche',  icon: IcoPlus,     show: true },
    { href: '/tableau-de-bord', label: 'Tableau de bord', icon: IcoDash,     show: isDirecteur || isManager },
    { href: '/equipe',          label: 'Équipe',          icon: IcoTeam,     show: isDirecteur },
    { href: '/parametres',      label: 'Paramètres',      icon: IcoSettings, show: isDirecteur },
    { href: '/aide',            label: 'Aide',            icon: IcoHelp,     show: true },
  ].filter((i) => i.show)

  return (
    <div
      className="flex flex-col h-full w-60 relative"
      style={{ background: 'var(--sidebar)' }}
    >
      {/* ── Bouton fermeture (mobile) ── */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-all md:hidden"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
        >
          {IcoClose}
        </button>
      )}

      {/* ── Logo ── */}
      <div
        className="px-5 py-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Link href="/">
          <NexflowLogo size="sm" context="sidebar" showTagline />
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item, i) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname === item.href}
            delay={i * 40}
          />
        ))}
      </nav>

      {/* ── Footer ── */}
      <div
        className="shrink-0 px-3 pb-4 pt-3 space-y-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Thème toggle */}
        <ThemeToggle />

        {/* User card */}
        {session && (
          <Link
            href="/parametres"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)' }}
          >
            <UserAvatar
              name={session.user?.name}
              email={session.user?.email}
              image={session.user?.image}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {session.user?.name ?? session.user?.email ?? 'Utilisateur'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {ROLE_LABEL[role] ?? role}
              </p>
            </div>
            {/* Chevron */}
            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        )}

        {/* Déconnexion */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200"
          style={{ color: 'rgba(248,113,113,0.7)' }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.color = '#f87171'
            b.style.background = 'rgba(239,68,68,0.08)'
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement
            b.style.color = 'rgba(248,113,113,0.7)'
            b.style.background = ''
          }}
        >
          {IcoLogout}
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
