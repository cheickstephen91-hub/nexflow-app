'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────
   DashboardChart
   Conteneur carte pour les graphiques Recharts.

   Props:
     title       string
     subtitle    string
     actions     ReactNode   — contrôles période, export…
     children    ReactNode   — le graphique Recharts
     minHeight   number      (défaut 260)
     className   string
───────────────────────────────────────────────────────── */

interface DashboardChartProps {
  title:      string
  subtitle?:  string
  actions?:   React.ReactNode
  children:   React.ReactNode
  minHeight?: number
  className?: string
}

export function DashboardChart({
  title,
  subtitle,
  actions,
  children,
  minHeight = 260,
  className = '',
}: DashboardChartProps) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        background:   'var(--card)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow:    'var(--shadow-card)',
        overflow:     'hidden',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {title}
          </p>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {/* Chart area */}
      <div
        className="flex-1 p-4"
        style={{ minHeight }}
      >
        {children}
      </div>
    </div>
  )
}
