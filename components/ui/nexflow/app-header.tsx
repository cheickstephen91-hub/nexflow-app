'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────
   AppHeader
   Barre d'en-tête de page : breadcrumb optionnel, titre,
   sous-titre, actions côté droit.

   Props:
     title         string
     subtitle      string
     breadcrumb    { label: string; href?: string }[]
     actions       ReactNode    — boutons, menus…
     border        boolean      — affiche la ligne de séparation (défaut true)
     className     string
───────────────────────────────────────────────────────── */

interface BreadcrumbItem {
  label: string
  href?:  string
}

interface AppHeaderProps {
  title:        string
  subtitle?:    string
  breadcrumb?:  BreadcrumbItem[]
  actions?:     React.ReactNode
  border?:      boolean
  className?:   string
}

export function AppHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  border    = true,
  className = '',
}: AppHeaderProps) {
  return (
    <header
      className={`flex items-start justify-between gap-4 px-6 py-5 ${className}`}
      style={border ? { borderBottom: '1px solid var(--border)' } : undefined}
    >
      {/* Left: breadcrumb + title */}
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-1.5" aria-label="Fil d'Ariane">
            {breadcrumb.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <svg
                    className="w-3 h-3 shrink-0"
                    style={{ color: 'var(--muted-foreground)' }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-xs font-medium transition-colors hover:underline"
                    style={{ color: 'var(--muted-foreground)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--foreground)'
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted-foreground)'
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <span
                    className="text-xs font-medium"
                    style={{ color: i === breadcrumb.length - 1 ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                  >
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1
          className="font-bold truncate"
          style={{
            fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
            color:    'var(--foreground)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p
            className="mt-0.5 text-sm truncate"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {actions}
        </div>
      )}
    </header>
  )
}
