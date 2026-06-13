'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────
   EmptyState
   Props:
     icon        ReactNode    — icône centrée (svg recommandé)
     title       string       — texte principal
     description string       — sous-texte
     action      ReactNode    — bouton ou lien CTA optionnel
     className   string
───────────────────────────────────────────────────────── */

interface EmptyStateProps {
  icon?:        React.ReactNode
  title:        string
  description?: string
  action?:      React.ReactNode
  className?:   string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-12 px-6 text-center ${className}`}
    >
      {icon && (
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: 'var(--secondary)',
            color:      'var(--muted-foreground)',
          }}
        >
          {icon}
        </div>
      )}
      <p
        className="font-semibold text-sm"
        style={{ color: 'var(--foreground)' }}
      >
        {title}
      </p>
      {description && (
        <p
          className="text-xs max-w-xs leading-relaxed"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
