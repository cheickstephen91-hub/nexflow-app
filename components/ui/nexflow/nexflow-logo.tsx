'use client'

import React from 'react'

/* ─────────────────────────────────────────────────────────
   NexflowLogo
   Props:
     size     'xs' | 'sm' | 'md' | 'lg' | 'xl'
     context  'sidebar' | 'page' | 'auth'
              sidebar → texte blanc (toujours sur fond sombre)
              page    → texte via CSS vars (suit le thème)
              auth    → identique à page
     showTagline  boolean — affiche "DIGITAL SOLUTIONS"
     className    string
───────────────────────────────────────────────────────── */

type LogoSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type LogoContext = 'sidebar' | 'page' | 'auth'

interface NexflowLogoProps {
  size?:        LogoSize
  context?:     LogoContext
  showTagline?: boolean
  className?:   string
}

const SIZES: Record<LogoSize, { icon: number; text: number; tagline: number }> = {
  xs: { icon: 18, text: 13, tagline: 8  },
  sm: { icon: 22, text: 16, tagline: 9  },
  md: { icon: 28, text: 20, tagline: 10 },
  lg: { icon: 36, text: 26, tagline: 11 },
  xl: { icon: 46, text: 32, tagline: 12 },
}

export function NexflowLogo({
  size        = 'md',
  context     = 'page',
  showTagline = false,
  className   = '',
}: NexflowLogoProps) {
  const s = SIZES[size]
  const onDark = context === 'sidebar'

  const nexColor     = onDark ? '#ffffff' : 'var(--foreground)'
  const flowColor    = onDark ? '#60a5fa' : 'var(--primary)'
  const taglineColor = onDark ? 'rgba(255,255,255,0.38)' : 'var(--muted-foreground)'

  /* Two overlapping diamonds — light blue + dark blue */
  const iconW = s.icon * 1.45
  const iconH = s.icon

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        {/* ── Diamond icon ── */}
        <svg
          width={iconW}
          height={iconH}
          viewBox="0 0 46 32"
          fill="none"
          aria-hidden="true"
        >
          {/* Left diamond: lighter blue */}
          <polygon points="13,1 24,16 13,31 2,16" fill="#60a5fa" />
          {/* Right diamond: primary blue */}
          <polygon points="27,1 38,16 27,31 16,16" fill="#2563eb" />
        </svg>

        {/* ── Wordmark ── */}
        <div
          style={{
            fontSize: s.text,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ color: nexColor }}>Nex</span>
          <span style={{ color: flowColor }}>flow</span>
        </div>
      </div>

      {showTagline && (
        <p
          style={{
            fontSize:      s.tagline,
            color:         taglineColor,
            letterSpacing: '0.22em',
            fontWeight:    500,
            textTransform: 'uppercase' as const,
            marginTop:     4,
            paddingLeft:   iconW + 8,
          }}
        >
          DIGITAL SOLUTIONS
        </p>
      )}
    </div>
  )
}
