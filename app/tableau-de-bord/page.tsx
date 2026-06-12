'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { supabase, type Fiche } from '@/lib/supabase'
// NavHeader replaced by Sidebar via AppShell
import { AnalyticsSection } from '@/components/analytics-section'

/* ── helpers ── */

function formatDate(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
      + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function topN(arr: Fiche[], key: keyof Fiche, n = 5): { label: string; count: number }[] {
  const map: Record<string, number> = {}
  for (const item of arr) {
    const v = String(item[key] ?? '').trim() || '—'
    map[v] = (map[v] ?? 0) + 1
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }))
}

/* ── badge urgence ── */

function UrgenceBadge({ value }: { value: string }) {
  const styles: Record<string, string> = {
    Urgent:       'bg-red-950/60 text-red-400 border border-red-700/40',
    Normal:       'bg-orange-950/60 text-orange-400 border border-orange-700/40',
    'Pas pressé': 'bg-emerald-950/60 text-emerald-400 border border-emerald-700/40',
  }
  const dots: Record<string, string> = {
    Urgent: 'bg-red-500', Normal: 'bg-orange-400', 'Pas pressé': 'bg-emerald-400',
  }
  const cls = styles[value] ?? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
  const dot = dots[value]  ?? 'bg-zinc-400'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {value || '—'}
    </span>
  )
}

/* ── carte stat ── */

function StatCard({ label, value, icon, accent, loading }: {
  label: string; value: number; icon: React.ReactNode; accent: string; loading: boolean
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
      <div>
        <p className="text-[#86efac]/70 text-xs tracking-widest uppercase font-medium mb-0.5">{label}</p>
        {loading
          ? <div className="h-7 w-12 bg-white/10 rounded animate-pulse" />
          : <p className="text-[#f0fdf4] text-2xl font-bold">{value}</p>
        }
      </div>
    </div>
  )
}

/* ── graphique barre CSS ── */

function StatBarChart({ title, data, barClass }: {
  title: string
  data: { label: string; count: number }[]
  barClass: string
}) {
  const max   = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <h3 className="text-[#86efac]/60 text-[10px] font-semibold tracking-widest uppercase mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#f0fdf4] truncate max-w-[65%]">{d.label}</span>
              <span className="text-[#86efac]/40 shrink-0 ml-1">
                {d.count}&nbsp;({total ? Math.round((d.count / total) * 100) : 0}%)
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barClass}`}
                style={{ width: `${(d.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── panneau detail fiche ── */

const FICHE_LABELS: { key: keyof Fiche; label: string }[] = [
  { key: 'nom_prospect', label: 'Nom du prospect'   },
  { key: 'telephone',    label: 'Téléphone'        },
  { key: 'source',       label: 'Source du contact' },
  { key: 'motif',        label: 'Motif de l\'appel' },
  { key: 'type_bien',    label: 'Type de bien'       },
  { key: 'budget',       label: 'Budget'             },
  { key: 'localisation', label: 'Localisation'       },
  { key: 'urgence',      label: 'Urgence'            },
  { key: 'agent',        label: 'Agent responsable'  },
  { key: 'transmettre_a',label: 'Transmettre à'         },
  { key: 'commentaire',  label: 'Commentaire'        },
]

function FicheDetailPanel({ fiche, onClose }: { fiche: Fiche; onClose: () => void }) {
  const dt = fiche.created_at ? formatDate(fiche.created_at) : null

  /* Close on Escape */
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0d1f11]/90 backdrop-blur-2xl border-l border-white/10 z-40 flex flex-col shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="min-w-0 pr-3">
            <p className="text-[#f0fdf4] font-bold text-base truncate">
              {fiche.nom_prospect || 'Prospect inconnu'}
            </p>
            {dt && <p className="text-[#86efac]/40 text-xs mt-0.5">{dt.full}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/40 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Badge urgence */}
        {fiche.urgence && (
          <div className="px-5 pt-4 shrink-0">
            <UrgenceBadge value={fiche.urgence} />
          </div>
        )}

        {/* Champs scrollables */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {FICHE_LABELS.map(({ key, label }) => {
            const val = fiche[key]
            if (!val) return null
            return (
              <div key={key} className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3">
                <p className="text-[#86efac]/40 text-[10px] font-semibold tracking-widest uppercase mb-0.5">
                  {label}
                </p>
                {key === 'urgence'
                  ? <UrgenceBadge value={String(val)} />
                  : <p className="text-[#f0fdf4] text-sm leading-relaxed break-words">{String(val)}</p>
                }
              </div>
            )
          })}
        </div>

        {/* ID footer */}
        {fiche.id && (
          <div className="px-5 py-3 border-t border-white/10 shrink-0">
            <p className="text-[#1e4a2e] text-[10px] font-mono">ID : {fiche.id}</p>
          </div>
        )}
      </div>
    </>
  )
}

/* ── page principale ── */

export default function TableauDeBord() {
  const { data: session, status } = useSession()
  const [fiches, setFiches]               = useState<Fiche[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null)

  /* plage analytics — synchronisée depuis AnalyticsSection */
  const [analyticsFrom, setAnalyticsFrom] = useState('')
  const [analyticsTo,   setAnalyticsTo]   = useState('')

  /* filtres */
  const [filterNom,     setFilterNom]     = useState('')
  const [filterSource,  setFilterSource]  = useState('')
  const [filterMotif,   setFilterMotif]   = useState('')
  const [filterUrgence, setFilterUrgence] = useState('')
  const [filterDateDu,  setFilterDateDu]  = useState('')
  const [filterDateAu,  setFilterDateAu]  = useState('')

  const userEmail = session?.user?.email ?? null

  const fetchFiches = useCallback(async (email: string | null) => {
    if (!email) return
    setError(null)
    setLoading(true)
    const { data, error: sbError } = await supabase
      .from('fiches')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })

    if (sbError) { setError(sbError.message) }
    else { setFiches((data as Fiche[]) ?? []) }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated' || !userEmail) return
    fetchFiches(userEmail)
    const channel = supabase
      .channel('fiches-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fiches' }, () => fetchFiches(userEmail))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchFiches, status, userEmail])

  const total    = fiches.length
  const today    = fiches.filter((f) => f.created_at?.slice(0, 10) === todayISO()).length
  const urgentes = fiches.filter((f) => f.urgence === 'Urgent').length

  /* fiches filtrées par la plage analytics pour les stats */
  const fichesByRange = (analyticsFrom || analyticsTo)
    ? fiches.filter((f) => {
        const d = f.created_at?.slice(0, 10) ?? ''
        if (analyticsFrom && d < analyticsFrom) return false
        if (analyticsTo   && d > analyticsTo)   return false
        return true
      })
    : fiches

  const bySource  = topN(fichesByRange, 'source')
  const byMotif   = topN(fichesByRange, 'motif')
  const byUrgence = topN(fichesByRange, 'urgence', 3)

  const hasFilter = !!(filterNom || filterSource || filterMotif || filterUrgence || filterDateDu || filterDateAu)

  const filtered = fiches.filter((f) => {
    if (filterNom     && !(f.nom_prospect ?? '').toLowerCase().includes(filterNom.toLowerCase())) return false
    if (filterSource  && f.source  !== filterSource)  return false
    if (filterMotif   && f.motif   !== filterMotif)   return false
    if (filterUrgence && f.urgence !== filterUrgence) return false
    if (filterDateDu  && f.created_at && f.created_at.slice(0, 10) < filterDateDu) return false
    if (filterDateAu  && f.created_at && f.created_at.slice(0, 10) > filterDateAu) return false
    return true
  })

  function resetFilters() {
    setFilterNom(''); setFilterSource(''); setFilterMotif('')
    setFilterUrgence(''); setFilterDateDu(''); setFilterDateAu('')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Refresh button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Tableau de bord</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Suivi en temps réel des fiches de qualification</p>
          </div>
          <button
            onClick={() => fetchFiches(userEmail)}
            title="Actualiser"
            className="p-2 rounded-lg border transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
          </button>
        </div>

        {/* Cartes stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total des fiches" value={total} loading={loading} accent="bg-[#166534]/40"
            icon={
              <svg className="w-6 h-6 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            }
          />
          <StatCard
            label="Fiches aujourd'hui" value={today} loading={loading} accent="bg-blue-950/60"
            icon={
              <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            }
          />
          <StatCard
            label="Fiches urgentes" value={urgentes} loading={loading} accent="bg-red-950/60"
            icon={
              <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            }
          />
        </div>

        {/* ── Section Analytiques ── */}
        <AnalyticsSection
          onRangeChange={(from, to) => { setAnalyticsFrom(from); setAnalyticsTo(to) }}
        />

        {/* Section statistiques */}
        {!loading && fiches.length > 0 && (
          <div>
            <h2 className="text-[#86efac]/50 text-[10px] font-semibold tracking-widest uppercase mb-3">
              Statistiques
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatBarChart title="Par source"  data={bySource}  barClass="bg-[#22c55e]" />
              <StatBarChart title="Par motif"   data={byMotif}   barClass="bg-blue-500"  />
              <StatBarChart title="Par urgence" data={byUrgence} barClass="bg-orange-500"/>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/40 border border-red-700/40 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">

          {/* Recherche nom prospect */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86efac]/30 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={filterNom}
              onChange={(e) => setFilterNom(e.target.value)}
              placeholder="Rechercher par nom de prospect…"
              className="w-full bg-white/5 border border-white/10 focus:border-[#22c55e]/50 focus:ring-1 focus:ring-[#22c55e]/20 text-white placeholder-white/20 rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none transition-all"
            />
            {filterNom && (
              <button onClick={() => setFilterNom('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86efac]/30 hover:text-[#86efac]/70 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>

          {/* Ligne dropdowns + dates */}
          <div className="flex flex-wrap gap-2 items-center">

            {/* Source */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className={`bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer appearance-none pr-7 ${filterSource ? 'border-[#22c55e]/60 text-white' : 'border-white/10 text-white/40'} focus:border-[#22c55e]/50`}
            >
              <option value="">Toutes les sources</option>
              {['Appel', 'Facebook', 'WhatsApp', 'Site web', 'Apimo', 'Visite directe', 'Recommandation', 'Autre'].map((v) => (
                <option key={v} value={v} className="bg-[#0f2318] text-[#f0fdf4]">{v}</option>
              ))}
            </select>

            {/* Motif */}
            <select
              value={filterMotif}
              onChange={(e) => setFilterMotif(e.target.value)}
              className={`bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer appearance-none pr-7 ${filterMotif ? 'border-[#22c55e]/60 text-white' : 'border-white/10 text-white/40'} focus:border-[#22c55e]/50`}
            >
              <option value="">Tous les motifs</option>
              {['Achat', 'Location', 'Vente', 'Syndic', 'Autre'].map((v) => (
                <option key={v} value={v} className="bg-[#0f2318] text-[#f0fdf4]">{v}</option>
              ))}
            </select>

            {/* Urgence */}
            <select
              value={filterUrgence}
              onChange={(e) => setFilterUrgence(e.target.value)}
              className={`bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer appearance-none pr-7 ${filterUrgence ? 'border-[#22c55e]/60 text-white' : 'border-white/10 text-white/40'} focus:border-[#22c55e]/50`}
            >
              <option value="">Toutes urgences</option>
              {['Urgent', 'Normal', 'Pas pressé'].map((v) => (
                <option key={v} value={v} className="bg-[#0f2318] text-[#f0fdf4]">{v}</option>
              ))}
            </select>

            {/* Séparateur */}
            <div className="h-5 w-px bg-white/15 hidden sm:block" />

            {/* Date Du */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#86efac]/40 text-xs">Du</span>
              <input
                type="date"
                value={filterDateDu}
                onChange={(e) => setFilterDateDu(e.target.value)}
                className={`bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer ${filterDateDu ? 'border-[#22c55e]/60 text-white' : 'border-white/10 text-white/30'} focus:border-[#22c55e]/50`}
              />
            </div>

            {/* Date Au */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#86efac]/40 text-xs">Au</span>
              <input
                type="date"
                value={filterDateAu}
                onChange={(e) => setFilterDateAu(e.target.value)}
                className={`bg-white/5 border rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer ${filterDateAu ? 'border-[#22c55e]/60 text-white' : 'border-white/10 text-white/30'} focus:border-[#22c55e]/50`}
              />
            </div>

            {/* Réinitialiser */}
            {hasFilter && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-800/40 hover:border-red-600/60 text-red-400/70 hover:text-red-400 text-xs font-medium transition-all ml-auto"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">

          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-[#f0fdf4] text-sm font-semibold">
              {hasFilter ? 'Résultats' : 'Toutes les fiches'}
              {!loading && (
                <span className="ml-2 bg-[#166534]/50 text-[#86efac] text-xs px-2 py-0.5 rounded-full font-normal">
                  {hasFilter ? `${filtered.length} / ${total}` : total}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[#86efac]/30 text-xs hidden sm:block">
                Cliquer sur une ligne pour voir le d&eacute;tail
              </span>
              <span className="flex items-center gap-1.5 text-[#22c55e] text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                Temps r&eacute;el
              </span>
            </div>
          </div>

          {/* skeleton */}
          {loading && (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* vide */}
          {!loading && filtered.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-[#22c55e]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-[#86efac]/60 text-sm">Aucune fiche pour le moment</p>
              <p className="text-[#4ade80]/30 text-xs mt-1">Les nouvelles fiches appara&icirc;tront ici automatiquement</p>
            </div>
          )}

          {/* aucun résultat avec filtres actifs */}
          {!loading && fiches.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <svg className="w-8 h-8 text-[#86efac]/20 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p className="text-[#86efac]/50 text-sm">Aucune fiche ne correspond aux filtres</p>
              <button onClick={resetFilters} className="mt-2 text-[#22c55e] text-xs hover:underline">
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* données */}
          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    {['Date / Heure', 'Prospect', 'Téléphone', 'Source', 'Motif', 'Urgence', 'Transmettre à'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[#86efac]/60 text-xs font-semibold tracking-wider uppercase px-4 py-3 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f, idx) => {
                    const { date, time } = f.created_at ? formatDate(f.created_at) : { date: '—', time: '—' }
                    const isLast = idx === filtered.length - 1
                    return (
                      <tr
                        key={f.id}
                        onClick={() => setSelectedFiche(f)}
                        className={`hover:bg-white/[0.04] transition-colors cursor-pointer ${!isLast ? 'border-b border-white/[0.06]' : ''}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[#f0fdf4] font-medium">{date}</span>
                          <span className="text-[#86efac]/40 text-xs ml-1.5">{time}</span>
                        </td>
                        <td className="px-4 py-3 text-[#f0fdf4] font-medium whitespace-nowrap">
                          {f.nom_prospect || <span className="text-[#4ade80]/30 italic">Inconnu</span>}
                        </td>
                        <td className="px-4 py-3 text-[#86efac]/80 whitespace-nowrap font-mono text-xs">
                          {f.telephone || '—'}
                        </td>
                        <td className="px-4 py-3 text-[#86efac]/70 whitespace-nowrap">{f.source || '—'}</td>
                        <td className="px-4 py-3 text-[#86efac]/70 whitespace-nowrap">{f.motif  || '—'}</td>
                        <td className="px-4 py-3"><UrgenceBadge value={f.urgence ?? ''} /></td>
                        <td className="px-4 py-3 text-[#86efac]/70 whitespace-nowrap">
                          {f.transmettre_a || <span className="text-[#4ade80]/30">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-[#15803d] text-xs tracking-widest pb-4">
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </main>

      {/* Panneau detail */}
      {selectedFiche && (
        <FicheDetailPanel fiche={selectedFiche} onClose={() => setSelectedFiche(null)} />
      )}
    </div>
  )
}
