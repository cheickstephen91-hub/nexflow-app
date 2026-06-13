'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { supabase, type Fiche } from '@/lib/supabase'
import { AnalyticsSection } from '@/components/analytics-section'
import { AppHeader, StatsCard } from '@/components/ui/nexflow'

/* ── helpers date ── */

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

/* ── sparkline : nombre de fiches par jour sur les 7 derniers jours ── */
function last7DaysCounts(fiches: Fiche[]): number[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const iso = d.toISOString().slice(0, 10)
    return fiches.filter((f) => f.created_at?.slice(0, 10) === iso).length
  })
}

/* ── export CSV client-side ── */
function exportCSV(fiches: Fiche[], filename: string) {
  const headers = [
    'Date', 'Prospect', 'Téléphone', 'Source', 'Motif',
    'Type de bien', 'Budget', 'Localisation', 'Urgence',
    'Agent', 'Transmettre à', 'Commentaire',
  ]
  const escape = (v: string | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`
  const rows = fiches.map((f) => [
    f.created_at ? new Date(f.created_at).toLocaleDateString('fr-FR') : '',
    f.nom_prospect, f.telephone, f.source, f.motif,
    f.type_bien, f.budget, f.localisation, f.urgence,
    f.agent, f.transmettre_a, f.commentaire,
  ].map((v) => escape(String(v ?? ''))).join(','))
  const csv  = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}

/* ── badge urgence ── */

function UrgenceBadge({ value }: { value: string }) {
  const styles: Record<string, React.CSSProperties> = {
    Urgent:       { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
    Normal:       { background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' },
    'Pas pressé': { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  }
  const dots: Record<string, string> = {
    Urgent: '#dc2626', Normal: '#ea580c', 'Pas pressé': '#16a34a',
  }
  const s   = styles[value] ?? { background: 'var(--secondary)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }
  const dot = dots[value] ?? 'var(--muted-foreground)'
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={s}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
      {value || '—'}
    </span>
  )
}

/* ── graphique barre CSS ── */

function StatBarChart({ title, data, barColor }: {
  title: string
  data: { label: string; count: number }[]
  barColor: string
}) {
  const max   = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <h3
        className="uppercase mb-4"
        style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}
      >
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between mb-1" style={{ fontSize: '0.875rem' }}>
              <span className="truncate max-w-[65%]" style={{ color: 'var(--foreground)' }}>{d.label}</span>
              <span className="shrink-0 ml-1" style={{ color: 'var(--muted-foreground)' }}>
                {d.count}&nbsp;({total ? Math.round((d.count / total) * 100) : 0}%)
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(d.count / max) * 100}%`, background: barColor }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── panneau détail fiche (slide-over) ── */

const FICHE_LABELS: { key: keyof Fiche; label: string }[] = [
  { key: 'nom_prospect',  label: 'Nom du prospect'    },
  { key: 'telephone',     label: 'Téléphone'          },
  { key: 'source',        label: 'Source du contact'  },
  { key: 'motif',         label: 'Motif de l\'appel'  },
  { key: 'type_bien',     label: 'Type de bien'        },
  { key: 'budget',        label: 'Budget'              },
  { key: 'localisation',  label: 'Localisation'        },
  { key: 'urgence',       label: 'Urgence'             },
  { key: 'agent',         label: 'Agent responsable'   },
  { key: 'transmettre_a', label: 'Transmettre à'       },
  { key: 'commentaire',   label: 'Commentaire'         },
]

function FicheDetailPanel({ fiche, onClose }: { fiche: Fiche; onClose: () => void }) {
  const dt = fiche.created_at ? formatDate(fiche.created_at) : null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} />
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md z-40 flex flex-col shadow-2xl"
        style={{ background: 'var(--card)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="min-w-0 pr-3">
            <p className="font-bold text-base truncate" style={{ color: 'var(--foreground)' }}>
              {fiche.nom_prospect || 'Prospect inconnu'}
            </p>
            {dt && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{dt.full}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg transition-all"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {fiche.urgence && (
          <div className="px-5 pt-4 shrink-0">
            <UrgenceBadge value={fiche.urgence} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {FICHE_LABELS.map(({ key, label }) => {
            const val = fiche[key]
            if (!val) return null
            return (
              <div
                key={key}
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
              >
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {label}
                </p>
                {key === 'urgence'
                  ? <UrgenceBadge value={String(val)} />
                  : <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--foreground)' }}>{String(val)}</p>
                }
              </div>
            )
          })}
        </div>

        {fiche.id && (
          <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[10px] font-mono" style={{ color: 'var(--muted-foreground)' }}>ID : {fiche.id}</p>
          </div>
        )}
      </div>
    </>
  )
}

/* ── page principale ── */

export default function TableauDeBord() {
  const { data: session, status } = useSession()
  const [fiches,        setFiches]        = useState<Fiche[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [selectedFiche, setSelectedFiche] = useState<Fiche | null>(null)

  const [analyticsFrom, setAnalyticsFrom] = useState('')
  const [analyticsTo,   setAnalyticsTo]   = useState('')

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

  /* ── dérivés ── */
  const total    = fiches.length
  const today    = fiches.filter((f) => f.created_at?.slice(0, 10) === todayISO()).length
  const urgentes = fiches.filter((f) => f.urgence === 'Urgent').length
  const sparkline = last7DaysCounts(fiches)

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

  const inputStyle: React.CSSProperties = {
    background: 'var(--secondary)',
    border: '1px solid var(--border)',
    color: 'var(--foreground)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        <AppHeader
          title="Tableau de bord"
          subtitle="Suivi en temps réel des fiches de qualification"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportCSV(
                  hasFilter ? filtered : fiches,
                  `nexflow-fiches-${todayISO()}.csv`
                )}
                disabled={fiches.length === 0}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                title={hasFilter ? `Exporter ${filtered.length} fiche(s) filtrée(s)` : `Exporter ${total} fiche(s)`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Exporter
              </button>
              <button
                onClick={() => fetchFiches(userEmail)}
                title="Actualiser"
                className="p-2.5 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
              </button>
            </div>
          }
        />

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label="TOTAL PRÉVISIONS"
            value={total}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            }
            iconBg="color-mix(in srgb, var(--success) 12%, transparent)"
            iconColor="var(--success)"
            sparkline={sparkline}
            sparkColor="var(--success)"
            loading={loading}
          />
          <StatsCard
            label="FICHES AUJOURD'HUI"
            value={today}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            }
            iconBg="color-mix(in srgb, var(--primary) 12%, transparent)"
            iconColor="var(--primary)"
            sparkline={sparkline}
            sparkColor="var(--primary)"
            loading={loading}
          />
          <StatsCard
            label="FICHES URGENTES"
            value={urgentes}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            }
            iconBg="color-mix(in srgb, var(--destructive) 12%, transparent)"
            iconColor="var(--destructive)"
            sparkline={sparkline}
            sparkColor="var(--destructive)"
            loading={loading}
          />
        </div>

        {/* Analytiques Recharts */}
        <AnalyticsSection
          onRangeChange={(from, to) => { setAnalyticsFrom(from); setAnalyticsTo(to) }}
        />

        {/* Barres stats par catégorie */}
        {!loading && fiches.length > 0 && (
          <div>
            <h2
              className="uppercase mb-3"
              style={{ color: 'var(--muted-foreground)', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.05em' }}
            >
              Statistiques
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatBarChart title="Par source"  data={bySource}  barColor="var(--success)"     />
              <StatBarChart title="Par motif"   data={byMotif}   barColor="var(--primary)"     />
              <StatBarChart title="Par urgence" data={byUrgence} barColor="#f97316"            />
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: 'color-mix(in srgb, var(--destructive) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
            }}
          >
            <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--destructive)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <p className="text-xs" style={{ color: 'var(--destructive)' }}>{error}</p>
          </div>
        )}

        {/* Filtres */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {/* Recherche nom */}
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: 'var(--muted-foreground)' }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={filterNom}
              onChange={(e) => setFilterNom(e.target.value)}
              placeholder="Rechercher par nom de prospect…"
              className="w-full rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none transition-all"
              style={{ ...inputStyle, borderColor: filterNom ? 'var(--primary)' : 'var(--border)' }}
            />
            {filterNom && (
              <button
                onClick={() => setFilterNom('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Dropdowns + dates */}
          <div className="flex flex-wrap gap-2 items-center">
            {[
              { value: filterSource,  set: setFilterSource,  placeholder: 'Toutes les sources', options: ['Appel','Facebook','WhatsApp','Site web','Apimo','Visite directe','Recommandation','Autre'] },
              { value: filterMotif,   set: setFilterMotif,   placeholder: 'Tous les motifs',    options: ['Achat','Location','Vente','Syndic','Autre'] },
              { value: filterUrgence, set: setFilterUrgence, placeholder: 'Toutes urgences',    options: ['Urgent','Normal','Pas pressé'] },
            ].map(({ value, set, placeholder, options }) => (
              <select
                key={placeholder}
                value={value}
                onChange={(e) => set(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer appearance-none pr-7"
                style={{ ...inputStyle, borderColor: value ? 'var(--primary)' : 'var(--border)' }}
              >
                <option value="">{placeholder}</option>
                {options.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            ))}

            <div className="h-5 w-px hidden sm:block" style={{ background: 'var(--border)' }} />

            {[
              { label: 'Du', value: filterDateDu, set: setFilterDateDu },
              { label: 'Au', value: filterDateAu, set: setFilterDateAu },
            ].map(({ label, value, set }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                <input
                  type="date"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer"
                  style={{ ...inputStyle, borderColor: value ? 'var(--primary)' : 'var(--border)' }}
                />
              </div>
            ))}

            {hasFilter && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ml-auto"
                style={{ border: '1px solid var(--destructive)', color: 'var(--destructive)', background: 'transparent' }}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Tableau des fiches */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
        >
          {/* Header tableau */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {hasFilter ? 'Résultats' : 'Toutes les fiches'}
              {!loading && (
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal"
                  style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}
                >
                  {hasFilter ? `${filtered.length} / ${total}` : total}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
                Cliquer sur une ligne pour voir le d&eacute;tail
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--success)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
                Temps r&eacute;el
              </span>
            </div>
          </div>

          {/* Skeleton */}
          {loading && (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
              ))}
            </div>
          )}

          {/* État vide — aucune fiche */}
          {!loading && fiches.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--secondary)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--muted-foreground)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Aucune fiche pour le moment</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
                Les nouvelles fiches appara&icirc;tront ici automatiquement
              </p>
            </div>
          )}

          {/* Aucun résultat après filtrage */}
          {!loading && fiches.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <svg className="w-8 h-8 mb-3" style={{ color: 'var(--muted-foreground)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Aucune fiche ne correspond aux filtres</p>
              <button onClick={resetFilters} className="mt-2 text-xs hover:underline" style={{ color: 'var(--primary)' }}>
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* Données */}
          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--secondary)' }}>
                    {['Date / Heure', 'Prospect', 'Téléphone', 'Source', 'Motif', 'Urgence', 'Transmettre à'].map((h) => (
                      <th
                        key={h}
                        className="text-left uppercase px-4 py-3 whitespace-nowrap"
                        style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}
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
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: !isLast ? '1px solid var(--border)' : undefined }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--secondary)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '' }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span style={{ color: 'var(--foreground)', fontSize: '0.875rem', fontWeight: 500 }}>{date}</span>
                          <span className="ml-1.5" style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>{time}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--foreground)', fontSize: '0.875rem', fontWeight: 500 }}>
                          {f.nom_prospect || <span className="italic" style={{ color: 'var(--muted-foreground)' }}>Inconnu</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                          {f.telephone || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>{f.source || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>{f.motif  || '—'}</td>
                        <td className="px-4 py-3"><UrgenceBadge value={f.urgence ?? ''} /></td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                          {f.transmettre_a || <span style={{ opacity: 0.4 }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs tracking-widest pb-4" style={{ color: 'var(--muted-foreground)' }}>
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </main>

      {selectedFiche && (
        <FicheDetailPanel fiche={selectedFiche} onClose={() => setSelectedFiche(null)} />
      )}
    </div>
  )
}
