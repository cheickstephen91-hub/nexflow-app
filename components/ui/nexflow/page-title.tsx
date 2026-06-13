'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────
   PageTitle
   En-tête de section : titre H1 + sous-titre optionnel.
   Utilisé en haut de chaque page applicative.

   Props:
     title      string
     subtitle   string       — texte secondaire
     actions    ReactNode    — boutons / badges à droite
     className  string
───────────────────────────────────────────────────────── */

interface PageTitleProps {
  title:     string
  subtitle?: string
  actions?:  React.ReactNode
  className?: string
}

export function PageTitle({
  title,
  subtitle,
  actions,
  className = '',
}: PageTitleProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h1
          className="font-bold tracking-tight"
          style={{
            fontSize:   'clamp(1.25rem, 2.5vw, 1.625rem)',
            color:      'var(--foreground)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-0.5 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  )
}
