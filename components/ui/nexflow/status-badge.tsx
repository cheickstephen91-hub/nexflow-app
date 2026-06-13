'use client'

import React from 'react'
import { useTheme } from '@/contexts/theme-context'

/* ─────────────────────────────────────────────────────────
   StatusBadge
   Props:
     label    string
     variant  BadgeVariant  (role ou état)
     icon     ReactNode     optionnel — icône avant le label
     dot      boolean       — petit cercle coloré à gauche
     size     'sm' | 'md'
───────────────────────────────────────────────────────── */

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted'
  | 'directeur'
  | 'manager'
  | 'collaborateur'
  | 'negociateur'
  | 'actif'
  | 'vous'

interface StatusBadgeProps {
  label:    string
  variant?: BadgeVariant
  icon?:    React.ReactNode
  dot?:     boolean
  size?:    'sm' | 'md'
}

type BadgeStyle = { bg: string; color: string; dotColor?: string }

const LIGHT_STYLES: Record<BadgeVariant, BadgeStyle> = {
  default:      { bg: '#f1f5f9', color: '#475569' },
  primary:      { bg: '#dbeafe', color: '#1d4ed8' },
  success:      { bg: '#dcfce7', color: '#16a34a', dotColor: '#22c55e' },
  warning:      { bg: '#fef9c3', color: '#92400e', dotColor: '#f59e0b' },
  destructive:  { bg: '#fee2e2', color: '#991b1b', dotColor: '#ef4444' },
  muted:        { bg: '#f1f5f9', color: '#6b7280' },
  directeur:    { bg: '#dbeafe', color: '#1d4ed8' },
  manager:      { bg: '#ede9fe', color: '#7c3aed' },
  collaborateur:{ bg: '#dcfce7', color: '#16a34a' },
  negociateur:  { bg: '#d1fae5', color: '#0d9488' },
  actif:        { bg: 'transparent', color: '#16a34a', dotColor: '#22c55e' },
  vous:         { bg: '#f1f5f9', color: '#475569' },
}

const DARK_STYLES: Record<BadgeVariant, BadgeStyle> = {
  default:      { bg: 'rgba(255,255,255,0.08)', color: '#94a3b8' },
  primary:      { bg: 'rgba(59,130,246,0.18)',  color: '#93c5fd' },
  success:      { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80',  dotColor: '#22c55e' },
  warning:      { bg: 'rgba(245,158,11,0.15)',  color: '#fcd34d',  dotColor: '#f59e0b' },
  destructive:  { bg: 'rgba(239,68,68,0.15)',   color: '#fca5a5',  dotColor: '#ef4444' },
  muted:        { bg: 'rgba(255,255,255,0.06)', color: '#64748b' },
  directeur:    { bg: 'rgba(59,130,246,0.18)',  color: '#93c5fd' },
  manager:      { bg: 'rgba(139,92,246,0.18)',  color: '#c4b5fd' },
  collaborateur:{ bg: 'rgba(34,197,94,0.15)',   color: '#4ade80' },
  negociateur:  { bg: 'rgba(20,184,166,0.18)',  color: '#5eead4' },
  actif:        { bg: 'transparent',            color: '#4ade80',  dotColor: '#22c55e' },
  vous:         { bg: 'rgba(255,255,255,0.08)', color: '#94a3b8' },
}

/* Icônes par rôle */
const ROLE_ICONS: Partial<Record<BadgeVariant, React.ReactNode>> = {
  directeur: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
      <path d="M8 1l1.5 3.5L13 5l-2.5 2.5.6 3.5L8 9.5l-3.1 1.5.6-3.5L3 5l3.5-.5z"/>
    </svg>
  ),
  manager: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <path d="M11 14v-1a3 3 0 00-3-3H4a3 3 0 00-3 3v1"/><circle cx="5.5" cy="6" r="2.5"/>
      <path d="M13 7a2 2 0 100-4 2 2 0 000 4M15 14v-1a3 3 0 00-2-2.83"/>
    </svg>
  ),
  collaborateur: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <path d="M10 14v-1a3 3 0 00-3-3H4a3 3 0 00-3 3v1"/><circle cx="5.5" cy="6" r="2.5"/>
    </svg>
  ),
  negociateur: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <path d="M10 14v-1a3 3 0 00-3-3H4a3 3 0 00-3 3v1"/><circle cx="5.5" cy="6" r="2.5"/>
    </svg>
  ),
}

export function StatusBadge({
  label,
  variant = 'default',
  icon,
  dot     = false,
  size    = 'sm',
}: StatusBadgeProps) {
  const { isDark } = useTheme()
  const styles     = isDark ? DARK_STYLES : LIGHT_STYLES
  const s          = styles[variant] ?? styles.default
  const roleIcon   = icon ?? ROLE_ICONS[variant]

  const showDot = dot || variant === 'actif'

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap"
      style={{
        background: s.bg,
        color:      s.color,
        fontSize:   size === 'sm' ? 11 : 12,
        padding:    size === 'sm' ? '2px 8px' : '4px 10px',
      }}
    >
      {showDot && (
        <span
          className="rounded-full shrink-0"
          style={{
            width:      6,
            height:     6,
            background: s.dotColor ?? s.color,
          }}
        />
      )}
      {!showDot && roleIcon && (
        <span className="shrink-0">{roleIcon}</span>
      )}
      {label}
    </span>
  )
}
