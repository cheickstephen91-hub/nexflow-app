'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────
   FormSection
   Section à l'intérieur d'une page (paramètres, infos…).
   Carte blanche avec icon-cercle + titre + contenu + actions.

   Props:
     id           string     — ancre HTML (scroll-to)
     title        string
     subtitle     string
     icon         ReactNode  — SVG dans le cercle
     iconBg       string     — background du cercle (CSS var ou hex)
     iconColor    string     — couleur de l'icône
     actions      ReactNode  — bouton Enregistrer etc.
     illustration ReactNode  — image décorative droite
     children     ReactNode
     className    string
───────────────────────────────────────────────────────── */

interface FormSectionProps {
  id?:           string
  title:         string
  subtitle?:     string
  icon?:         React.ReactNode
  iconBg?:       string
  iconColor?:    string
  actions?:      React.ReactNode
  illustration?: React.ReactNode
  children:      React.ReactNode
  className?:    string
}

export function FormSection({
  id,
  title,
  subtitle,
  icon,
  iconBg    = 'var(--accent)',
  iconColor = 'var(--accent-foreground)',
  actions,
  illustration,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <div
      id={id}
      className={`relative overflow-hidden scroll-mt-20 ${className}`}
      style={{
        background:   'var(--card)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow:    'var(--shadow-card)',
      }}
    >
      {/* Illustration décorative (positionnée en absolu) */}
      {illustration && (
        <div
          className="absolute bottom-0 right-4 pointer-events-none select-none opacity-80"
          aria-hidden="true"
        >
          {illustration}
        </div>
      )}

      {/* Header de section */}
      <div
        className="flex items-center gap-3 px-6 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: iconBg, color: iconColor }}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2
            className="font-semibold text-sm"
            style={{ color: 'var(--foreground)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">{children}</div>

      {/* Footer actions */}
      {actions && (
        <div
          className="px-6 pb-5"
          style={{ marginTop: -8 }}
        >
          {actions}
        </div>
      )}
    </div>
  )
}
