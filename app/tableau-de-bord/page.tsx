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
  const styles: Record<string, React.CSSProperties> = {
    Urgent:       { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
    Normal:       { background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa' },
    'Pas pressé': { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  }
  const dots: Record<string, string> = {
    Urgent: '#dc2626', Normal: '#ea580c', 'Pas pressé': '#16a34a',
  }
  const s   = styles[value] ?? { background: 'var(--bg-card-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }
  const dot = dots[value]   ?? 'var(--text-muted)'
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={s}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
      {value || '—'}
    </span>
  )
}

/* ── carte stat ── */

function StatCard({ label, value, icon, accentBg, loading }: {
  label: string; value: number; icon: React.ReactNode; accentBg: string; loading: boolean
}) {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 shadow-sm"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accentBg }}
      >
        {icon}
      </div>
      <div>
        <p className="uppercase mb-0.5" style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
          {label}
        </p>
        {loading
          ? <div className="h-8 w-14 rounded animate-pulse" style={{ background: 'var(--border)' }} />
          : <p style={{ color: '#1e293b', fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.1 }}>{value}</p>
        }
      </div>
    </div>
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
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <h3
        className="uppercase mb-4"
        style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}
      >
        {title}
      </h3>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex justify-between mb-1" style={{ fontSize: '0.875rem' }}>
              <span className="truncate max-w-[65%]" style={{ color: '#1e293b' }}>{d.label}</span>
              <span className="shrink-0 ml-1" style={{ color: '#64748b' }}>
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md z-40 flex flex-col shadow-2xl"
        style={{ background: 'var(--bg-card)', borderLeft: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="min-w-0 pr-3">
            <p className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>
              {fiche.nom_prospect || 'Prospect inconnu'}
            </p>
            {dt && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{dt.full}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg transition-all"
            style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
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
              <div
                key={key}
                className="rounded-xl px-4 py-3"
                style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}
              >
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
                {key === 'urgence'
                  ? <UrgenceBadge value={String(val)} />
                  : <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--text-primary)' }}>{String(val)}</p>
                }
              </div>
            )
          })}
        </div>

        {/* ID footer */}
        {fiche.id && (
          <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>ID : {fiche.id}</p>
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

  const total    = fiches.length
  const today    = fiches.filter((f) => f.created_at?.slice(0, 10) === todayISO()).length
  const urgentes = fiches.filter((f) => f.urgence === 'Urgent').length

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
    background: 'var(--bg-card-hover)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ color: '#1e293b', fontSize: '1.5rem', fontWeight: 700 }}>Tableau de bord</h1>
            <p className="mt-0.5" style={{ color: '#64748b', fontSize: '0.875rem' }}>Suivi en temps réel des fiches de qualification</p>
          </div>
          <button
            onClick={() => fetchFiches(userEmail)}
            title="Actualiser"
            className="p-2 rounded-lg transition-all"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
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
            label="Total des fiches" value={total} loading={loading}
            accentBg="rgba(34,197,94,0.12)"
            icon={
              <svg className="w-6 h-6" style={{ color: '#22c55e' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            }
          />
          <StatCard
            label="Fiches aujourd'hui" value={today} loading={loading}
            accentBg="rgba(59,130,246,0.12)"
            icon={
              <svg className="w-6 h-6" style={{ color: '#3b82f6' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            }
          />
          <StatCard
            label="Fiches urgentes" value={urgentes} loading={loading}
            accentBg="rgba(239,68,68,0.12)"
            icon={
              <svg className="w-6 h-6" style={{ color: '#ef4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            }
          />
        </div>

        {/* Section Analytiques */}
        <AnalyticsSection
          onRangeChange={(from, to) => { setAnalyticsFrom(from); setAnalyticsTo(to) }}
        />

        {/* Statistiques */}
        {!loading && fiches.length > 0 && (
          <div>
            <h2 className="uppercase mb-3" style={{ color: '#64748b', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              Statistiques
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatBarChart title="Par source"  data={bySource}  barColor="var(--success)" />
              <StatBarChart title="Par motif"   data={byMotif}   barColor="#3b82f6"        />
              <StatBarChart title="Par urgence" data={byUrgence} barColor="#f97316"        />
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 dark:bg-red-950/40 dark:border-red-700/40">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>
          </div>
        )}

        {/* Filtres */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {/* Recherche nom */}
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              value={filterNom}
              onChange={(e) => setFilterNom(e.target.value)}
              placeholder="Rechercher par nom de prospect…"
              className="w-full rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none transition-all focus:ring-1 focus:ring-blue-500/30"
              style={{ ...inputStyle, borderColor: filterNom ? 'var(--accent)' : 'var(--border)' }}
            />
            {filterNom && (
              <button onClick={() => setFilterNom('')} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
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
                style={{ ...inputStyle, borderColor: value ? 'var(--accent)' : 'var(--border)' }}
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
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <input
                  type="date"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer"
                  style={{ ...inputStyle, borderColor: value ? 'var(--accent)' : 'var(--border)' }}
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

        {/* Tableau */}
        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <h2 className="text-sm" style={{ color: '#1e293b', fontWeight: 600 }}>
              {hasFilter ? 'Résultats' : 'Toutes les fiches'}
              {!loading && (
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded-full font-normal"
                  style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                >
                  {hasFilter ? `${filtered.length} / ${total}` : total}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                Cliquer sur une ligne pour voir le d&eacute;tail
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--success)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }} />
                Temps r&eacute;el
              </span>
            </div>
          </div>

          {/* skeleton */}
          {loading && (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
              ))}
            </div>
          )}

          {/* vide */}
          {!loading && filtered.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-card-hover)' }}>
                <svg className="w-7 h-7" style={{ color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aucune fiche pour le moment</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Les nouvelles fiches appara&icirc;tront ici automatiquement</p>
            </div>
          )}

          {/* aucun résultat filtré */}
          {!loading && fiches.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <svg className="w-8 h-8 mb-3" style={{ color: 'var(--text-muted)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aucune fiche ne correspond aux filtres</p>
              <button onClick={resetFilters} className="mt-2 text-xs hover:underline" style={{ color: 'var(--accent)' }}>
                Réinitialiser les filtres
              </button>
            </div>
          )}

          {/* données */}
          {!loading && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-card-hover)' }}>
                    {['Date / Heure', 'Prospect', 'Téléphone', 'Source', 'Motif', 'Urgence', 'Transmettre à'].map((h) => (
                      <th
                        key={h}
                        className="text-left uppercase px-4 py-3 whitespace-nowrap"
                        style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}
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
                        className="transition-colors cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                        style={{ borderBottom: !isLast ? '1px solid var(--border)' : undefined }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span style={{ color: '#1e293b', fontSize: '0.875rem', fontWeight: 500 }}>{date}</span>
                          <span className="ml-1.5" style={{ color: '#64748b', fontSize: '0.75rem' }}>{time}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#1e293b', fontSize: '0.875rem', fontWeight: 500 }}>
                          {f.nom_prospect || <span className="italic" style={{ color: '#94a3b8' }}>Inconnu</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono" style={{ color: '#475569', fontSize: '0.875rem' }}>
                          {f.telephone || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#475569', fontSize: '0.875rem' }}>{f.source || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#475569', fontSize: '0.875rem' }}>{f.motif  || '—'}</td>
                        <td className="px-4 py-3"><UrgenceBadge value={f.urgence ?? ''} /></td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {f.transmettre_a || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs tracking-widest pb-4" style={{ color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </main>

      {selectedFiche && (
        <FicheDetailPanel fiche={selectedFiche} onClose={() => setSelectedFiche(null)} />
      )}
    </div>
  )
}
