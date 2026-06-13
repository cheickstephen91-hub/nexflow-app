'use client'

import React from 'react'
import { UserAvatar } from './user-avatar'
import { StatusBadge } from './status-badge'

/* ─────────────────────────────────────────────────────────
   InvitationCard
   Ligne d'invitation en attente (page Équipe).

   Props:
     name       string
     email      string
     role       string        — label du rôle
     expiresAt  string        — texte d'expiration
     onCancel   () => void
     loading    boolean       — état chargement du bouton annuler
───────────────────────────────────────────────────────── */

interface InvitationCardProps {
  name:        string
  email:       string
  role:        string
  expiresAt?:  string
  onCancel?:   () => void
  loading?:    boolean
}

export function InvitationCard({
  name,
  email,
  role,
  expiresAt,
  onCancel,
  loading = false,
}: InvitationCardProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: 'var(--muted)',
        border:     '1px solid var(--border)',
      }}
    >
      {/* Avatar */}
      <UserAvatar name={name} email={email} size="sm" />

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {name}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
          {email}
        </p>
      </div>

      {/* Rôle */}
      <StatusBadge label={role} variant="default" size="sm" />

      {/* Expiration */}
      {expiresAt && (
        <span
          className="hidden sm:flex items-center gap-1 text-xs"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {expiresAt}
        </span>
      )}

      {/* Bouton annuler */}
      {onCancel && (
        <button
          onClick={onCancel}
          disabled={loading}
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          style={{
            border:  '1px solid rgba(239,68,68,0.4)',
            color:   'var(--destructive)',
          }}
          onMouseEnter={(e) => {
            const btn = e.currentTarget
            btn.style.background = 'rgba(239,68,68,0.06)'
          }}
          onMouseLeave={(e) => {
            const btn = e.currentTarget
            btn.style.background = 'transparent'
          }}
        >
          {loading ? '…' : 'Annuler'}
        </button>
      )}
    </div>
  )
}
