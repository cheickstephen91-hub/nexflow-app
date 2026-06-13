'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────
   StatsCard
   Carte KPI : icône + label + valeur + tendance % + sparkline SVG.

   Props:
     label        string
     value        number | string
     trend        number         — positif = vert, négatif = rouge
     trendLabel   string         — texte sous la tendance ("vs hier"…)
     icon         ReactNode      — SVG de l'icône
     iconBg       string         — bg du cercle icône (CSS var ou hex)
     iconColor    string         — couleur de l'icône
     sparkline    number[]       — points pour le mini-graphique
     sparkColor   string         — couleur de la ligne sparkline
     loading      boolean
     className    string
───────────────────────────────────────────────────────── */

interface StatsCardProps {
  label:       string
  value:       number | string | null
  trend?:      number
  trendLabel?: string
  icon?:       React.ReactNode
  iconBg?:     string
  iconColor?:  string
  sparkline?:  number[]
  sparkColor?: string
  loading?:    boolean
  className?:  string
}

/* ── Micro sparkline SVG ── */
function Sparkline({
  data,
  color,
  width  = 120,
  height = 40,
}: {
  data:    number[]
  color:   string
  width?:  number
  height?: number
}) {
  if (!data || data.length < 2) return null

  const min   = Math.min(...data)
  const max   = Math.max(...data)
  const range = max - min || 1
  const pad   = 3

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - pad - ((v - min) / range) * (height - pad * 2)
    return [x, y] as [number, number]
  })

  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  /* Area fill under the line */
  const areaD = `${d} L ${pts[pts.length - 1][0].toFixed(1)},${height} L 0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#spark-grad-${color.replace('#', '')})`}
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── Skeleton pulse ── */
function Skeleton({ w, h }: { w: number | string; h: number }) {
  return (
    <span
      className="inline-block rounded animate-pulse"
      style={{ width: w, height: h, background: 'var(--border)' }}
    />
  )
}

export function StatsCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  iconBg    = 'var(--secondary)',
  iconColor = 'var(--foreground)',
  sparkline,
  sparkColor = 'var(--primary)',
  loading   = false,
  className = '',
}: StatsCardProps) {
  const trendUp    = trend !== undefined && trend >= 0
  const trendColor = trend === undefined ? 'var(--muted-foreground)'
    : trendUp ? '#22c55e' : '#ef4444'
  const trendArrow = trendUp ? '↑' : '↓'

  return (
    <div
      className={`relative flex flex-col gap-3 p-5 overflow-hidden card-hover ${className}`}
      style={{
        background:   'var(--card)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow:    'var(--shadow-card)',
      }}
    >
      {/* Top row: icon + label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: iconBg, color: iconColor }}
            >
              {icon}
            </div>
          )}
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {label}
          </p>
        </div>
        {/* Sparkline top-right */}
        {sparkline && !loading && (
          <div className="shrink-0">
            <Sparkline data={sparkline} color={sparkColor} />
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        {loading ? (
          <Skeleton w={80} h={36} />
        ) : (
          <p
            className="font-bold"
            style={{ fontSize: 32, lineHeight: 1, color: 'var(--foreground)' }}
          >
            {value ?? '—'}
          </p>
        )}
      </div>

      {/* Trend */}
      {(trend !== undefined || trendLabel) && (
        <div className="flex items-center gap-1.5">
          {trend !== undefined && !loading && (
            <span
              className="text-xs font-semibold"
              style={{ color: trendColor }}
            >
              {trendArrow} {Math.abs(trend)}%
            </span>
          )}
          {trendLabel && (
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
