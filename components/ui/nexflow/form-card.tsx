'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────
   FormCard
   Carte blanche centrée pour les formulaires (login, nouvelle-fiche…).

   Props:
     children    ReactNode
     maxWidth    number | string  (défaut 520)
     className   string
     noPadding   boolean
───────────────────────────────────────────────────────── */

interface FormCardProps {
  children:   React.ReactNode
  maxWidth?:  number | string
  className?: string
  noPadding?: boolean
}

export function FormCard({
  children,
  maxWidth  = 520,
  className = '',
  noPadding = false,
}: FormCardProps) {
  return (
    <div
      className={`w-full mx-auto ${className}`}
      style={{
        maxWidth:     typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
        background:   'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow:    'var(--shadow-modal)',
        padding:      noPadding ? 0 : 'clamp(28px, 5vw, 44px)',
      }}
    >
      {children}
    </div>
  )
}
