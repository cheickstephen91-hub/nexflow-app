'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getUserProfile } from '@/lib/user-profile'

function HomeContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessDenied = searchParams.get('access') === 'denied'

  const role         = (session as { role?: string } | null)?.role ?? 'negociateur'
  const isAdmin      = role === 'admin'
  const canDashboard = isAdmin || role === 'superviseur'

  const [statsToday, setStatsToday] = useState<number | null>(null)
  const [statsTotal, setStatsTotal] = useState<number | null>(null)

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return
    getUserProfile(session.user.email).then((p) => {
      if (!p?.onboarding_complete) router.replace('/onboarding')
    })
  }, [status, session, router])

  useEffect(() => {
    if (status !== 'authenticated') return

    fetch('/api/stats')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: { today_count: number; total_count: number }) => {
        setStatsToday(data.today_count)
        setStatsTotal(data.total_count)
      })
      .catch((err) => {
        console.error('[page/stats] fetch error:', err)
        setStatsToday(0)
        setStatsTotal(0)
      })
  }, [status])

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-[#0a1a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a1a0f] relative flex flex-col items-center justify-center px-4 py-12">

      {/* Background decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-[#22c55e]/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-[#22c55e]/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#166534]/[0.05] rounded-full blur-[140px]" />
      </div>

      {accessDenied && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-5 py-2.5 rounded-xl shadow-xl">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Acc&#232;s non autoris&#233; pour votre r&#244;le.
        </div>
      )}

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="mb-1">
              <span style={{ fontWeight: 700, fontSize: '32px', color: '#ffffff' }}>Nex</span>
              <span style={{ fontWeight: 700, fontSize: '32px', color: '#22c55e' }}>flow</span>
            </div>
            <div style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '4px' }}>DIGITAL SOLUTIONS</div>
          </div>

          {/* Sous-titre */}
          <p className="text-center text-[#86efac]/70 text-[10px] tracking-[0.2em] uppercase mb-8 font-light whitespace-nowrap">
            Qualification d&apos;appels &middot; Agence Immobili&egrave;re
          </p>

          <div className="h-px bg-white/[0.07] mb-8" />

          {/* Stats rapides */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#22c55e] mb-1">
                {statsToday === null ? (
                  <span className="inline-block w-8 h-7 bg-white/10 rounded animate-pulse" />
                ) : statsToday}
              </div>
              <div className="text-[10px] text-white/40 tracking-widest uppercase">Aujourd&apos;hui</div>
            </div>
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white/80 mb-1">
                {statsTotal === null ? (
                  <span className="inline-block w-8 h-7 bg-white/10 rounded animate-pulse" />
                ) : statsTotal}
              </div>
              <div className="text-[10px] text-white/40 tracking-widest uppercase">Total fiches</div>
            </div>
          </div>

          {/* CTA principal */}
          <Link
            href="/nouvelle-fiche"
            className="flex items-center justify-center gap-2.5 w-full bg-[#22c55e] hover:bg-[#16a34a] text-[#0a1a0f] font-semibold text-base py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-[#22c55e]/25 hover:shadow-[#22c55e]/40 hover:scale-[1.02] active:scale-[0.98] mb-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nouvelle fiche
          </Link>

          {/* Liens secondaires */}
          <div className="flex gap-3">
            {canDashboard && (
              <Link
                href="/tableau-de-bord"
                className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-[#22c55e]/50 hover:bg-[#22c55e]/5 text-white/60 hover:text-[#22c55e] text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                Tableau de bord
              </Link>
            )}
            <Link
              href="/aide"
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/[0.08] text-white/60 hover:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Aide
            </Link>
          </div>

        </div>

        {/* Liens admin sous la card */}
        {isAdmin && (
          <div className="flex items-center justify-center gap-4 mt-5">
            <Link href="/equipe" className="flex items-center gap-1.5 text-[#15803d] hover:text-[#22c55e] text-xs tracking-widest transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              &#201;quipe
            </Link>
            <span className="text-white/10">|</span>
            <Link href="/parametres" className="flex items-center gap-1.5 text-[#15803d] hover:text-[#22c55e] text-xs tracking-widest transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Param&#232;tres
            </Link>
          </div>
        )}

        <p className="text-center mt-6 text-[#15803d]/60 text-xs tracking-widest">
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0a1a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />
      </main>
    }>
      <HomeContent />
    </Suspense>
  )
}
