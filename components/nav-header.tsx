'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

/* ── Types ── */

type CurrentPage =
  | 'home'
  | 'nouvelle-fiche'
  | 'tableau-de-bord'
  | 'equipe'
  | 'parametres'
  | 'aide'

interface NavHeaderProps {
  currentPage?: CurrentPage
  maxWidth?: 'max-w-2xl' | 'max-w-3xl' | 'max-w-5xl' | 'max-w-7xl'
  /** Éléments insérés entre le logo et les liens (ex : bouton Actualiser) */
  actions?: React.ReactNode
}

/* ── Icônes ── */

const IconHelp = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const IconTeam = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const IconSettings = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const IconDashboard = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
)

const IconPlus = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)

const IconLogout = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconUser = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

/* ── Helper initiales ── */

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

/* ── Menu profil ── */

function ProfileMenu() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const name     = session?.user?.name
  const email    = session?.user?.email
  const initials = getInitials(name, email)

  // Ferme le dropdown si clic en dehors
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!session) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Avatar bouton */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu profil"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: '#22c55e',
          color: 'white',
          fontWeight: 700,
          fontSize: '13px',
          border: '2px solid rgba(34,197,94,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'box-shadow 0.2s',
          boxShadow: open ? '0 0 0 3px rgba(34,197,94,0.25)' : 'none',
        }}
      >
        {initials}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            minWidth: '220px',
            background: 'rgba(10,26,15,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '12px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.05)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {/* Infos utilisateur */}
          <div style={{ padding: '12px 14px 10px' }}>
            <p style={{ color: '#f0fdf4', fontWeight: 600, fontSize: '13px', margin: 0, lineHeight: 1.3 }}>
              {name ?? 'Utilisateur'}
            </p>
            <p style={{ color: 'rgba(134,239,172,0.5)', fontSize: '11px', margin: '2px 0 0', lineHeight: 1 }}>
              {email}
            </p>
          </div>

          {/* Séparateur */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 8px' }} />

          {/* Liens */}
          <div style={{ padding: '6px' }}>
            <Link
              href="/parametres"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                color: 'rgba(240,253,244,0.8)',
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(34,197,94,0.1)'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#4ade80'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(240,253,244,0.8)'
              }}
            >
              {IconUser}
              Mon profil
            </Link>

            <Link
              href="/parametres"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                color: 'rgba(240,253,244,0.8)',
                fontSize: '13px',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(34,197,94,0.1)'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#4ade80'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(240,253,244,0.8)'
              }}
            >
              {IconSettings}
              Paramètres
            </Link>
          </div>

          {/* Séparateur */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 8px' }} />

          {/* Déconnexion */}
          <div style={{ padding: '6px' }}>
            <button
              onClick={() => { setOpen(false); signOut({ callbackUrl: '/login' }) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              {IconLogout}
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Composant principal ── */

export function NavHeader({ currentPage, maxWidth = 'max-w-3xl', actions }: NavHeaderProps) {
  const { data: session } = useSession()
  const role = (session as { role?: string } | null)?.role ?? 'collaborateur'

  const isAdmin       = role === 'directeur'
  const isSuperviseur = role === 'manager'

  const links: { href: string; label: string; icon: React.ReactNode }[] = []

  if (currentPage !== 'aide') {
    links.push({ href: '/aide', label: 'Aide', icon: IconHelp })
  }
  if (isAdmin && currentPage !== 'equipe') {
    links.push({ href: '/equipe', label: 'Équipe', icon: IconTeam })
  }
  if (isAdmin && currentPage !== 'parametres') {
    links.push({ href: '/parametres', label: 'Paramètres', icon: IconSettings })
  }
  if ((isAdmin || isSuperviseur) && currentPage !== 'tableau-de-bord') {
    links.push({ href: '/tableau-de-bord', label: 'Tableau de bord', icon: IconDashboard })
  }

  const showCTA = currentPage !== 'nouvelle-fiche'

  return (
    <header className="border-b border-white/10 bg-[#0a1a0f]/80 backdrop-blur-2xl sticky top-0 z-10">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-3 flex items-center justify-between`}>

        {/* Logo */}
        <Link href="/">
          <div>
            <span style={{ fontWeight: 700, fontSize: '22px', color: '#ffffff' }}>Nex</span>
            <span style={{ fontWeight: 700, fontSize: '22px', color: '#22c55e' }}>flow</span>
            <div style={{ fontSize: '9px', color: '#9CA3AF', letterSpacing: '3px' }}>DIGITAL SOLUTIONS</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">

          {actions}

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-200 text-sm font-medium"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          {showCTA && (
            <Link
              href="/nouvelle-fiche"
              className="flex items-center gap-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-[#0a1a0f] font-semibold text-sm py-2 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#22c55e]/20"
            >
              {IconPlus}
              Nouvelle fiche
            </Link>
          )}

          {/* Menu profil */}
          <ProfileMenu />
        </nav>
      </div>
    </header>
  )
}
