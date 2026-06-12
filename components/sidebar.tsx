'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/theme-context'

/* ── SVG Icons ── */

const IcoHome = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
const IcoPlus = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
  </svg>
)
const IcoDashboard = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const IcoTeam = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const IcoSettings = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
)
const IcoHelp = (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoMoon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
)
const IcoSun = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)
const IcoLogout = (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

/* ── Role helpers ── */

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

const ROLE_LABEL: Record<string, string> = {
  directeur:    'Directeur',
  manager:      'Manager',
  collaborateur:'Collaborateur',
}

/* ── SidebarItem ── */

function SidebarItem({
  href, label, icon, active, delay,
}: {
  href: string; label: string; icon: React.ReactNode; active: boolean; delay: number
}) {
  const { isDark } = useTheme()

  const activeStyle = isDark
    ? 'bg-[#22c55e]/15 text-[#22c55e]'
    : 'bg-[#2563eb] text-white'

  const inactiveStyle = 'text-white/70 hover:bg-white/10 hover:text-white'

  return (
    <Link
      href={href}
      className={`sidebar-item-animate flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? activeStyle : inactiveStyle}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
    </Link>
  )
}

/* ── Main Sidebar ── */

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession()
  const { isDark, toggleTheme } = useTheme()
  const pathname = usePathname()

  const role = (session as { role?: string } | null)?.role ?? 'collaborateur'
  console.log('[DEBUG SIDEBAR] role:', role, '| session:', JSON.stringify(session))
  const isDirecteur = role === 'directeur'
  const isManager   = role === 'manager'

  const name     = session?.user?.name
  const email    = session?.user?.email
  const initials = getInitials(name, email)

  const navItems = [
    { href: '/',                label: 'Accueil',          icon: IcoHome,      show: true },
    { href: '/nouvelle-fiche',  label: 'Nouvelle fiche',   icon: IcoPlus,      show: true },
    { href: '/tableau-de-bord', label: 'Tableau de bord',  icon: IcoDashboard, show: isDirecteur || isManager },
    { href: '/equipe',          label: 'Équipe',           icon: IcoTeam,      show: isDirecteur },
    { href: '/parametres',      label: 'Paramètres',       icon: IcoSettings,  show: isDirecteur },
    { href: '/aide',            label: 'Aide',             icon: IcoHelp,      show: true },
  ].filter((i) => i.show)

  const sidebarBg = isDark ? '#0d2318' : '#1e3a5f'

  return (
    <div
      className="flex flex-col h-full w-60"
      style={{ background: sidebarBg }}
    >
      {/* Close button (mobile overlay) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all md:hidden"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      )}

      {/* ── Logo ── */}
      <div className="px-5 py-5 border-b border-white/10 shrink-0">
        <Link href="/" className="block">
          <div className="flex items-baseline gap-0.5">
            <span className="font-bold text-xl text-white">Nex</span>
            <span className="font-bold text-xl" style={{ color: isDark ? '#22c55e' : '#60a5fa' }}>flow</span>
          </div>
          <div className="text-[9px] text-white/35 tracking-[3px] font-medium mt-0.5">DIGITAL SOLUTIONS</div>
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => (
          <SidebarItem
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
      <div className="border-t border-white/10 p-3 space-y-2 shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200"
        >
          {isDark ? IcoSun : IcoMoon}
          <span>{isDark ? 'Mode clair' : 'Mode sombre'}</span>
        </button>

        {/* User info */}
        {session && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/5">
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ background: isDark ? '#22c55e' : '#2563eb' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{name ?? email ?? 'Utilisateur'}</p>
              <p className="text-white/40 text-[10px] truncate">{ROLE_LABEL[role] ?? role}</p>
            </div>
          </div>
        )}

        {/* Déconnexion */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          {IcoLogout}
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
