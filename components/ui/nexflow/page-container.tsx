'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────
   PageContainer
   Wrapper principal de chaque page applicative.
   Gère le background, le padding responsive et le max-width.

   Props:
     children   ReactNode
     maxWidth   'sm'|'md'|'lg'|'xl'|'2xl'|'full'  (défaut 'xl')
     className  string
     noPadding  boolean — pour pages qui gèrent leur propre padding
───────────────────────────────────────────────────────── */

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

interface PageContainerProps {
  children:   React.ReactNode
  maxWidth?:  MaxWidth
  className?: string
  noPadding?: boolean
}

const MAX_WIDTHS: Record<MaxWidth, string> = {
  sm:   'max-w-xl',
  md:   'max-w-3xl',
  lg:   'max-w-5xl',
  xl:   'max-w-6xl',
  '2xl':'max-w-7xl',
  full: 'max-w-none',
}

export function PageContainer({
  children,
  maxWidth  = 'xl',
  className = '',
  noPadding = false,
}: PageContainerProps) {
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'var(--background)' }}
    >
      <div
        className={`
          mx-auto w-full
          ${MAX_WIDTHS[maxWidth]}
          ${noPadding ? '' : 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8'}
          ${className}
        `}
      >
        {children}
      </div>
    </div>
  )
}
