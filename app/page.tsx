'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getUserProfile } from '@/lib/user-profile'
import { useTheme } from '@/contexts/theme-context'

/* ── Bento Card ── */

function BentoCard({
  children, className = '', style,
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties
}) {
  return (
    <div
      className={`card-hover rounded-2xl border p-5 shadow-sm ${className}`}
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── Stat Number ── */

function StatNumber({ value, label, accent }: { value: number | null; label: string; accent?: boolean }) {
  const { isDark } = useTheme()
  const accentColor = isDark ? '#22c55e' : '#2563eb'
  return (
    <div className="text-center">
      <div
        className="text-4xl font-bold mb-1"
        style={{ color: accent ? accentColor : 'var(--text-primary)' }}
      >
        {value === null ? (
          <span className="inline-block w-12 h-10 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
        ) : value}
      </div>
      <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  )
}

/* ── Home Content ── */

function HomeContent() {
  const { data: session, status } = useSession()
  const { isDark } = useTheme()
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessDenied = searchParams.get('access') === 'denied'

  const role         = (session as { role?: string } | null)?.role ?? 'collaborateur'
  console.log('[DEBUG PAGE] role depuis session:', role, '| session complète:', JSON.stringify(session))
  const isDirecteur  = role === 'directeur'
  const canDashboard = isDirecteur || role === 'manager'

  const [statsToday, setStatsToday] = useState<number | null>(null)
  const [statsTotal, setStatsTotal] = useState<number | null>(null)

  const accentColor = isDark ? '#22c55e' : '#2563eb'
  const accentHover = isDark ? '#16a34a' : '#1d4ed8'

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return
    getUserProfile(session.user.email).then((p) => {
      if (!p?.onboarding_complete) router.replace('/onboarding')
    })
  }, [status, session, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/stats')
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: { today_count: number; total_count: number }) => {
        setStatsToday(d.today_count)
        setStatsTotal(d.total_count)
      })
      .catch(() => { setStatsToday(0); setStatsTotal(0) })
  }, [status])

  useEffect(() => {
    if (accessDenied) {
      const url = new URL(window.location.href)
      url.searchParams.delete('access')
      window.history.replaceState({}, '', url.toString())
    }
  }, [accessDenied])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-5 md:p-8" style={{ background: 'var(--bg-primary)' }}>

      {/* Access denied toast */}
      {accessDenied && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-5 py-2.5 rounded-xl shadow-lg dark:bg-red-950/50 dark:border-red-700/50 dark:text-red-300">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Accès non autorisé pour votre rôle.
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Bonjour{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* ── Bento Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">

        {/* Card 1 — Stats (grande, 2 colonnes) */}
        <BentoCard className="sm:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              Activité
            </p>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: isDark ? 'rgba(34,197,94,0.12)' : '#eff6ff', color: accentColor }}
            >
              Live
            </span>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <StatNumber value={statsToday} label="Aujourd'hui" accent />
            <StatNumber value={statsTotal} label="Total fiches" />
          </div>
          <div className="mt-5 h-px" style={{ background: 'var(--border)' }} />
          <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            {statsToday !== null && statsToday > 0
              ? `${statsToday} fiche${statsToday > 1 ? 's' : ''} qualifiée${statsToday > 1 ? 's' : ''} aujourd'hui`
              : "Aucune fiche qualifiée aujourd'hui — commencez maintenant !"}
          </p>
        </BentoCard>

        {/* Card 2 — Nouvelle fiche (CTA principale) */}
        <BentoCard>
          <div className="flex flex-col h-full min-h-[160px]">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0"
              style={{ background: isDark ? 'rgba(34,197,94,0.12)' : '#eff6ff' }}
            >
              <svg className="w-5 h-5" style={{ color: accentColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Nouvelle fiche
            </p>
            <p className="text-xs mb-4 flex-1" style={{ color: 'var(--text-secondary)' }}>
              Qualifiez un nouvel appel entrant
            </p>
            <Link
              href="/nouvelle-fiche"
              className="flex items-center justify-center gap-2 w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: accentColor }}
            >
              Commencer
            </Link>
          </div>
        </BentoCard>

        {/* Card 3 — Tableau de bord (si accès) */}
        {canDashboard && (
          <BentoCard>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Tableau de bord
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              Analyses et statistiques de votre équipe
            </p>
            <Link
              href="/tableau-de-bord"
              className="text-sm font-semibold transition-colors"
              style={{ color: accentColor }}
            >
              Voir les stats →
            </Link>
          </BentoCard>
        )}

        {/* Card 4 — Accès rapide Aide */}
        <BentoCard>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#f0fdf4' }}
          >
            <svg className="w-5 h-5" style={{ color: isDark ? '#4ade80' : '#16a34a' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Aide</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
            Guide d&apos;utilisation et FAQ
          </p>
          <Link
            href="/aide"
            className="text-sm font-semibold transition-colors"
            style={{ color: accentColor }}
          >
            Consulter →
          </Link>
        </BentoCard>

        {/* Card 5 — Équipe (directeur only) */}
        {isDirecteur && (
          <BentoCard>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#faf5ff' }}
            >
              <svg className="w-5 h-5" style={{ color: isDark ? '#c084fc' : '#9333ea' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Équipe</p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              Gérer les membres et invitations
            </p>
            <Link
              href="/equipe"
              className="text-sm font-semibold transition-colors"
              style={{ color: isDark ? '#c084fc' : '#9333ea' }}
            >
              Gérer →
            </Link>
          </BentoCard>
        )}

      </div>

      {/* Footer */}
      <p className="mt-12 text-xs tracking-widest text-center" style={{ color: 'var(--text-muted)' }}>
        &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
      </p>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
