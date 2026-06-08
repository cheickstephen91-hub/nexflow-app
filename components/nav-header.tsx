'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

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

/* ── Composant ── */

export function NavHeader({ currentPage, maxWidth = 'max-w-3xl', actions }: NavHeaderProps) {
  const { data: session } = useSession()
  const role = (session as { role?: string } | null)?.role ?? 'negociateur'

  const isAdmin       = role === 'admin'
  const isSuperviseur = role === 'superviseur'

  /* Liens visibles selon le rôle et la page courante */
  const links: { href: string; label: string; icon: React.ReactNode }[] = []

  /* Aide — toujours visible */
  if (currentPage !== 'aide') {
    links.push({ href: '/aide', label: 'Aide', icon: IconHelp })
  }

  /* Équipe — admin uniquement */
  if (isAdmin && currentPage !== 'equipe') {
    links.push({ href: '/equipe', label: 'Équipe', icon: IconTeam })
  }

  /* Paramètres — admin uniquement */
  if (isAdmin && currentPage !== 'parametres') {
    links.push({ href: '/parametres', label: 'Paramètres', icon: IconSettings })
  }

  /* Tableau de bord — admin + superviseur */
  if ((isAdmin || isSuperviseur) && currentPage !== 'tableau-de-bord') {
    links.push({ href: '/tableau-de-bord', label: 'Tableau de bord', icon: IconDashboard })
  }

  const showCTA = currentPage !== 'nouvelle-fiche'

  return (
    <header className="border-b border-white/10 bg-[#0a1a0f]/80 backdrop-blur-2xl sticky top-0 z-10">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-3 flex items-center justify-between`}>

        {/* Logo inline */}
        <Link href="/">
          <div>
            <span style={{ fontWeight: 700, fontSize: '22px', color: '#ffffff' }}>Nex</span>
            <span style={{ fontWeight: 700, fontSize: '22px', color: '#22c55e' }}>flow</span>
            <div style={{ fontSize: '9px', color: '#9CA3AF', letterSpacing: '3px' }}>DIGITAL SOLUTIONS</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">

          {/* Boutons supplémentaires (ex: Actualiser) */}
          {actions}

          {/* Liens rôle-conditionnels */}
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

          {/* CTA Nouvelle fiche */}
          {showCTA && (
            <Link
              href="/nouvelle-fiche"
              className="flex items-center gap-1.5 bg-[#22c55e] hover:bg-[#16a34a] text-[#0a1a0f] font-semibold text-sm py-2 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#22c55e]/20"
            >
              {IconPlus}
              Nouvelle fiche
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
