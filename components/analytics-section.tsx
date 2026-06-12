'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell,
  PieChart, Pie, Legend,
} from 'recharts'
import type { AnalyticsPayload } from '@/app/api/analytics/route'

/* ── helpers date ── */

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}
function isoSubDays(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10)
}
function isoSubMonths(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 10)
}
function isoSubYears(n: number) {
  const d = new Date(); d.setFullYear(d.getFullYear() - n); return d.toISOString().slice(0, 10)
}
function fmtDisplayDate(iso: string) {
  if (!iso) return ''
  const [y, m, dd] = iso.split('-')
  return `${dd}/${m}/${y}`
}

/* ── Raccourcis ── */

type Shortcut = { label: string; getFrom: () => string; getTo: () => string }

const SHORTCUTS: Shortcut[] = [
  { label: '7j',     getFrom: () => isoSubDays(6),      getTo: isoToday },
  { label: '30j',    getFrom: () => isoSubDays(29),     getTo: isoToday },
  { label: '3 mois', getFrom: () => isoSubMonths(3),    getTo: isoToday },
  { label: '1 an',   getFrom: () => isoSubYears(1),     getTo: isoToday },
  { label: 'Tout',   getFrom: () => '2020-01-01',       getTo: isoToday },
]

/* ── Couleurs ── */

const SOURCE_COLORS: Record<string, string> = {
  Appel:            '#22c55e',
  Facebook:         '#3b82f6',
  WhatsApp:         '#10b981',
  'Site web':       '#8b5cf6',
  Apimo:            '#f59e0b',
  'Visite directe': '#ec4899',
  Recommandation:   '#06b6d4',
  Autre:            '#6b7280',
}

/* ── Tooltip ── */

function GlassTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; color?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 shadow-xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
      {label && <p className="text-[10px] mb-1" style={{ color: '#64748b' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-semibold" style={{ color: p.color ?? '#22c55e' }}>
          {p.value} fiche{p.value > 1 ? 's' : ''}
        </p>
      ))}
    </div>
  )
}

/* ── Donut label central ── */

function DonutCenter({ total }: { total: number }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-6" fontSize={32} fontWeight={700} fill="#1e293b">{total}</tspan>
      <tspan x="50%" dy={20} fontSize={12} fill="#64748b">fiches</tspan>
    </text>
  )
}

/* ── Skeleton card ── */

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return (
    <div className="rounded-2xl p-5 shadow-sm space-y-3" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div className="h-3 w-28 rounded animate-pulse" style={{ background: '#e2e8f0' }} />
      <div className={`${tall ? 'h-[200px]' : 'h-[180px]'} rounded-xl animate-pulse`} style={{ background: '#f1f5f9' }} />
    </div>
  )
}

/* ── Props ── */

export interface AnalyticsSectionProps {
  /** Callback déclenché à chaque application d'une période */
  onRangeChange?: (from: string, to: string) => void
}

/* ── Composant principal ── */

export function AnalyticsSection({ onRangeChange }: AnalyticsSectionProps) {
  const defaultFrom = isoSubDays(29)
  const defaultTo   = isoToday()

  const [fromDate,  setFromDate]  = useState(defaultFrom)
  const [toDate,    setToDate]    = useState(defaultTo)
  /* appliedRange déclenche le fetch — ne change qu'au clic "Appliquer" ou raccourci */
  const [applied,   setApplied]   = useState<{ from: string; to: string }>({ from: defaultFrom, to: defaultTo })
  const [activeShortcut, setActiveShortcut] = useState<string>('30j')

  const [data,    setData]    = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  /* Fetch déclenché uniquement par `applied` */
  useEffect(() => {
    if (!mounted) return
    setLoading(true)
    setError(null)
    fetch(`/api/analytics?from=${applied.from}&to=${applied.to}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<AnalyticsPayload> })
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => { setError(String(e)); setLoading(false) })
    onRangeChange?.(applied.from, applied.to)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, mounted])

  /* Applique les dates des inputs */
  function applyDates() {
    if (!fromDate || !toDate || fromDate > toDate) return
    setApplied({ from: fromDate, to: toDate })
    setActiveShortcut('')
  }

  /* Raccourci — remplit ET applique immédiatement */
  const applyShortcut = useCallback((sc: Shortcut) => {
    const from = sc.getFrom()
    const to   = sc.getTo()
    setFromDate(from)
    setToDate(to)
    setApplied({ from, to })
    setActiveShortcut(sc.label)
  }, [])

  const urgenceTotal = data?.urgences.reduce((s, u) => s + u.value, 0) ?? 0
  const isInvalid    = !fromDate || !toDate || fromDate > toDate

  return (
    <section>

      {/* ── Titre section ── */}
      <div className="mb-4">
        <h2 className="text-sm" style={{ color: '#1e293b', fontWeight: 600 }}>Analytiques</h2>
        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Évolution et répartition sur la période sélectionnée</p>
      </div>

      {/* ── Contrôles de période ── */}
      <div className="rounded-2xl p-4 mb-4 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>

        <div className="flex flex-wrap items-end gap-3">

          {/* Du */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>Du</label>
            <input
              type="date"
              value={fromDate}
              max={toDate || isoToday()}
              onChange={(e) => { setFromDate(e.target.value); setActiveShortcut('') }}
              className="rounded-xl px-3 py-2 text-sm outline-none transition-all cursor-pointer"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' }}
            />
          </div>

          {/* Au */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#64748b' }}>Au</label>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={isoToday()}
              onChange={(e) => { setToDate(e.target.value); setActiveShortcut('') }}
              className="rounded-xl px-3 py-2 text-sm outline-none transition-all cursor-pointer"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' }}
            />
          </div>

          {/* Appliquer */}
          <button
            onClick={applyDates}
            disabled={isInvalid}
            className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/30 font-semibold text-sm px-5 py-2 rounded-xl transition-all duration-200 shadow-md shadow-[#22c55e]/20 hover:shadow-[#22c55e]/30"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Appliquer
          </button>

          {/* Séparateur */}
          <div className="h-8 w-px hidden sm:block" style={{ background: '#e2e8f0' }} />

          {/* Raccourcis */}
          <div className="flex items-center gap-1 flex-wrap">
            {SHORTCUTS.map((sc) => (
              <button
                key={sc.label}
                onClick={() => applyShortcut(sc)}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                style={activeShortcut === sc.label
                  ? { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }
                  : { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }
                }
              >
                {sc.label}
              </button>
            ))}
          </div>

          {/* Période appliquée */}
          {applied.from && applied.to && (
            <span className="text-xs ml-auto hidden md:block" style={{ color: '#94a3b8' }}>
              {fmtDisplayDate(applied.from)} → {fmtDisplayDate(applied.to)}
            </span>
          )}
        </div>

        {isInvalid && fromDate && toDate && (
          <p className="text-red-400/70 text-xs mt-2 flex items-center gap-1.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            La date de début doit être antérieure à la date de fin.
          </p>
        )}
      </div>

      {/* Indicateur chargement */}
      {loading && mounted && (
        <div className="flex items-center gap-2 text-[#22c55e]/60 text-xs mb-4">
          <div className="w-3 h-3 border border-[#22c55e] border-t-transparent rounded-full animate-spin" />
          Chargement…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-700/30 rounded-xl px-4 py-2.5 mb-4 text-red-400 text-xs">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          Impossible de charger les analytiques — {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Graphique 1 : Courbe évolution ── */}
        <div className="lg:col-span-2">
          {loading || !mounted ? <SkeletonCard tall /> : (
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 className="uppercase mb-4" style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                Évolution des fiches
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data?.evolution ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<GlassTooltip />} cursor={{ stroke: 'rgba(34,197,94,0.2)', strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#22c55e', stroke: 'rgba(34,197,94,0.3)', strokeWidth: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Graphique 3 : Donut urgence ── */}
        <div>
          {loading || !mounted ? <SkeletonCard /> : (
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 className="uppercase mb-4" style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                Par urgence
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data?.urgences ?? []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {(data?.urgences ?? []).map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={0.85} />
                    ))}
                  </Pie>
                  <DonutCenter total={urgenceTotal} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const p = payload[0]
                      const pct = urgenceTotal ? Math.round(((p.value as number) / urgenceTotal) * 100) : 0
                      return (
                        <div className="rounded-xl px-3 py-2 shadow-xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                          <p className="text-[10px] mb-0.5" style={{ color: '#64748b' }}>{p.name as string}</p>
                          <p className="text-xs font-semibold" style={{ color: (p.payload as { color: string }).color }}>
                            {p.value as number} fiche{(p.value as number) > 1 ? 's' : ''} · {pct}%
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: '0.8125rem', color: '#64748b', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── Graphique 2 : Barres par source ── */}
        <div className="lg:col-span-3">
          {loading || !mounted ? <SkeletonCard /> : (
            <div className="rounded-2xl p-5 shadow-sm" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 className="uppercase mb-4" style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                Fiches par source de contact
              </h3>
              {(data?.sources ?? []).length === 0 ? (
                <p className="text-xs text-center py-12" style={{ color: '#94a3b8' }}>Aucune donnée sur cette période</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data?.sources ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="source" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {(data?.sources ?? []).map((entry, i) => (
                        <Cell key={i} fill={SOURCE_COLORS[entry.source] ?? '#6b7280'} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  )
}
