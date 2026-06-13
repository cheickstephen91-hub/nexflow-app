'use client'

import React from 'react'
import Image from 'next/image'

/* ─────────────────────────────────────────────────────────
   UserAvatar
   Props:
     name      string | null  — used for initials + color hash
     email     string | null  — fallback for initials
     image     string | null  — photo URL (Google OAuth)
     size      'xs'|'sm'|'md'|'lg'|'xl'
     showOnline boolean       — green presence dot
     className  string
───────────────────────────────────────────────────────── */

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface UserAvatarProps {
  name?:       string | null
  email?:      string | null
  image?:      string | null
  size?:       AvatarSize
  showOnline?: boolean
  className?:  string
}

const AVATAR_SIZES: Record<AvatarSize, { px: number; text: number; dot: number }> = {
  xs: { px: 24, text: 9,  dot: 6  },
  sm: { px: 30, text: 11, dot: 7  },
  md: { px: 36, text: 13, dot: 9  },
  lg: { px: 44, text: 16, dot: 10 },
  xl: { px: 56, text: 20, dot: 12 },
}

/* Deterministic color from name/email string */
const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
]

function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

export function UserAvatar({
  name,
  email,
  image,
  size      = 'md',
  showOnline = false,
  className  = '',
}: UserAvatarProps) {
  const s        = AVATAR_SIZES[size]
  const initials = getInitials(name, email)
  const bgColor  = stringToColor((name ?? email ?? '?'))

  return (
    <div
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: s.px, height: s.px }}
    >
      {image ? (
        <Image
          src={image}
          alt={name ?? email ?? 'avatar'}
          fill
          className="rounded-full object-cover"
          sizes={`${s.px}px`}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center font-bold select-none"
          style={{
            width:      s.px,
            height:     s.px,
            background: bgColor,
            color:      '#ffffff',
            fontSize:   s.text,
          }}
        >
          {initials}
        </div>
      )}

      {showOnline && (
        <span
          className="absolute bottom-0 right-0 rounded-full ring-2"
          style={{
            width:       s.dot,
            height:      s.dot,
            background:  'var(--success)',
            boxShadow:   '0 0 0 2px var(--card)',
          }}
        />
      )}
    </div>
  )
}
