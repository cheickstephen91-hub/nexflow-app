'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams }     from 'next/navigation'
import Link                               from 'next/link'
import { supabase }                       from '@/lib/supabase'
import { getInvitationByToken, acceptInvitation, type Invitation } from '@/lib/invitations'
import bcrypt                             from 'bcryptjs'
import { NexflowLogo }                   from '@/components/ui/nexflow'

/* ── Icônes ────────────────────────────────────────────────────────────────── */

const IcoCheck = (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
)
const IcoCross = (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)
const IcoClock = (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IcoUser = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  </svg>
)
const IcoSpin = (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)

/* ── Composants UI locaux ───────────────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: '#374151' }}>
      {children}
    </label>
  )
}

/* Champ en lecture seule (email, nom) */
function ReadonlyField({ value, icon }: { value: string; icon?: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
      style={{ background: '#f8fafc', border: '1px solid #e5e7eb', color: '#94a3b8', cursor: 'not-allowed' }}
    >
      {icon && <span style={{ color: '#cbd5e1' }}>{icon}</span>}
      <span className="flex-1 truncate">{value}</span>
    </div>
  )
}

/* Champ mot de passe avec toggle show/hide */
function PasswordField({
  value, onChange, placeholder, showPwd, onToggle,
}: {
  value: string; onChange: (v: string) => void
  placeholder: string; showPwd: boolean; onToggle: () => void
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all"
      style={{
        background: '#fff',
        border:     `1.5px solid ${focused ? '#2563eb' : '#e5e7eb'}`,
        boxShadow:  focused ? '0 0 0 3px rgba(37,99,235,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <svg className="w-4 h-4 shrink-0" style={{ color: focused ? '#2563eb' : '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
      <input
        type={showPwd ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: '#1e293b' }}
      />
      <button
        type="button"
        onClick={onToggle}
        className="p-0.5 shrink-0 transition-colors"
        style={{ color: '#94a3b8', lineHeight: 0 }}
        aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {showPwd ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  )
}

/* Carte état (loading / success / error / used / expired / invalid) */
function StatusCard({
  icon, iconBg, iconColor, title, description, children,
}: {
  icon: React.ReactNode; iconBg: string; iconColor: string
  title: string; description: string; children?: React.ReactNode
}) {
  return (
    <div className="text-center py-2">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <h2 className="text-lg font-bold mb-2" style={{ color: '#0f172a' }}>{title}</h2>
      <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{description}</p>
      {children}
    </div>
  )
}

/* ── Contenu principal (séparé pour Suspense) ────────────────────────────── */

function ActivateContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [invitation,  setInvitation]  = useState<Invitation | null>(null)
  const [status,      setStatus]      = useState<'loading' | 'valid' | 'invalid' | 'expired' | 'used' | 'success'>('loading')
  const [password,    setPassword]    = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPwd,     setShowPwd]     = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  /* Charger l'invitation — logique inchangée */
  useEffect(() => {
    if (!token) { setStatus('invalid'); return }

    getInvitationByToken(token).then((inv) => {
      if (!inv)          { setStatus('invalid');  return }
      if (inv.accepted)  { setStatus('used');     return }
      if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
        setStatus('expired'); return
      }
      setInvitation(inv)
      setStatus('valid')
    })
  }, [token])

  /* Activation du compte — logique inchangée */
  async function handleActivate(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return
    setError(null)

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirmPass) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)

    try {
      const hash = await bcrypt.hash(password, 10)

      /* Vérifier si l'utilisateur existe déjà (compte Google) */
      const { data: existing } = await supabase
        .from('users')
        .select('email, password_hash')
        .eq('email', invitation.email)
        .maybeSingle()

      if (existing) {
        /* Mise à jour : ajout du mot de passe et du rôle */
        const { error: updErr } = await supabase
          .from('users')
          .update({ password_hash: hash, role: invitation.role, onboarding_complete: true })
          .eq('email', invitation.email)

        if (updErr) throw new Error(updErr.message)
      } else {
        /* Création du compte */
        const { error: insErr } = await supabase.from('users').insert([{
          email:               invitation.email,
          nom:                 invitation.nom,
          password_hash:       hash,
          role:                invitation.role,
          onboarding_complete: true,
        }])

        if (insErr) throw new Error(insErr.message)
      }

      /* Marquer l'invitation comme acceptée */
      await acceptInvitation(token)

      setStatus('success')
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      setSubmitting(false)
    }
  }

  /* ── État : chargement ── */
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
        />
        <p className="text-sm font-medium" style={{ color: '#64748b' }}>Vérification du lien&hellip;</p>
      </div>
    )
  }

  /* ── État : lien invalide ── */
  if (status === 'invalid') {
    return (
      <StatusCard
        icon={IcoCross}
        iconBg="#fef2f2"
        iconColor="#dc2626"
        title="Lien invalide"
        description="Ce lien d'invitation est invalide ou introuvable. Vérifiez que vous avez copié l'URL complète."
      >
        <Link
          href="/login"
          className="inline-block mt-6 text-sm font-semibold transition-colors"
          style={{ color: '#2563eb' }}
        >
          ← Retour à la connexion
        </Link>
      </StatusCard>
    )
  }

  /* ── État : lien expiré ── */
  if (status === 'expired') {
    return (
      <StatusCard
        icon={IcoClock}
        iconBg="#fff7ed"
        iconColor="#ea580c"
        title="Lien expiré"
        description="Ce lien d'invitation a expiré. Contactez votre administrateur pour recevoir un nouvel email d'invitation."
      >
        <Link
          href="/login"
          className="inline-block mt-6 text-sm font-semibold transition-colors"
          style={{ color: '#2563eb' }}
        >
          ← Retour à la connexion
        </Link>
      </StatusCard>
    )
  }

  /* ── État : invitation déjà utilisée ── */
  if (status === 'used') {
    return (
      <StatusCard
        icon={IcoCheck}
        iconBg="#eff6ff"
        iconColor="#2563eb"
        title="Compte déjà activé"
        description="Cette invitation a déjà été utilisée. Votre compte est prêt, vous pouvez vous connecter."
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 mt-6 rounded-full text-sm font-bold text-white px-6 py-3 transition-all"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 6px 20px rgba(37,99,235,0.30)' }}
        >
          Se connecter →
        </Link>
      </StatusCard>
    )
  }

  /* ── État : succès ── */
  if (status === 'success') {
    return (
      <StatusCard
        icon={IcoCheck}
        iconBg="#eff6ff"
        iconColor="#2563eb"
        title="Compte activé !"
        description="Votre compte Nexflow est prêt. Redirection vers la page de connexion…"
      >
        <div className="mt-5 flex justify-center">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
          />
        </div>
      </StatusCard>
    )
  }

  /* ── Formulaire d'activation (status === 'valid') ── */
  const ROLE_LABELS: Record<string, string> = {
    collaborateur: 'Collaborateur', manager: 'Manager', directeur: 'Directeur',
  }

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <p className="text-xs font-bold tracking-[0.22em] uppercase mb-1" style={{ color: '#2563eb' }}>Invitation</p>
        <h2 className="text-xl font-bold mb-1" style={{ color: '#0f172a' }}>Activer votre compte</h2>
        <p className="text-sm" style={{ color: '#64748b' }}>Choisissez un mot de passe pour finaliser votre inscription.</p>
      </div>

      {/* Badge rôle */}
      <div
        className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-6"
        style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
      >
        <span style={{ color: '#2563eb' }}>{IcoUser}</span>
        <p className="text-xs" style={{ color: '#1e40af' }}>
          Invité en tant que{' '}
          <span className="font-bold">
            {ROLE_LABELS[invitation?.role ?? ''] ?? invitation?.role}
          </span>
        </p>
      </div>

      <form onSubmit={handleActivate} className="space-y-4">

        {/* Email — lecture seule */}
        <div>
          <FieldLabel>Email</FieldLabel>
          <ReadonlyField
            value={invitation?.email ?? ''}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            }
          />
        </div>

        {/* Nom — lecture seule */}
        <div>
          <FieldLabel>Nom</FieldLabel>
          <ReadonlyField
            value={invitation?.nom ?? ''}
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            }
          />
        </div>

        {/* Mot de passe */}
        <div>
          <FieldLabel>Mot de passe <span style={{ color: '#2563eb' }}>*</span></FieldLabel>
          <PasswordField
            value={password}
            onChange={setPassword}
            placeholder="Minimum 8 caractères"
            showPwd={showPwd}
            onToggle={() => setShowPwd((v) => !v)}
          />
        </div>

        {/* Confirmation mot de passe */}
        <div>
          <FieldLabel>Confirmer le mot de passe <span style={{ color: '#2563eb' }}>*</span></FieldLabel>
          <PasswordField
            value={confirmPass}
            onChange={setConfirmPass}
            placeholder="Répéter le mot de passe"
            showPwd={showPwd}
            onToggle={() => setShowPwd((v) => !v)}
          />
          {/* Indicateur de correspondance */}
          {confirmPass.length > 0 && (
            <p
              className="text-xs mt-1.5 font-medium"
              style={{ color: password === confirmPass ? '#16a34a' : '#dc2626' }}
            >
              {password === confirmPass ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
            </p>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <svg className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#dc2626' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        {/* Bouton principal */}
        <button
          type="submit"
          disabled={submitting || !password || !confirmPass}
          className="w-full flex items-center justify-center gap-2 rounded-full font-bold text-sm py-4 mt-2 transition-all duration-200"
          style={{
            background:  (submitting || !password || !confirmPass) ? '#bfdbfe' : 'linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%)',
            color:       (submitting || !password || !confirmPass) ? 'rgba(255,255,255,0.7)' : '#fff',
            boxShadow:   (submitting || !password || !confirmPass) ? 'none' : '0 8px 24px rgba(37,99,235,0.30)',
            cursor:      (submitting || !password || !confirmPass) ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!(submitting || !password || !confirmPass)) {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg,#2563eb,#1d4ed8)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!(submitting || !password || !confirmPass)) {
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'none'
            }
          }}
        >
          {submitting ? (
            <>{IcoSpin} Activation en cours&hellip;</>
          ) : (
            '✓ Activer mon compte'
          )}
        </button>

      </form>
    </div>
  )
}

/* ── Page wrapper ────────────────────────────────────────────────────────── */

export default function ActiverCompte() {
  return (
    <main
      className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #f8fafc 100%)' }}
    >

      {/* Blobs décoratifs — cohérents avec Login et Onboarding */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo v2 */}
        <div className="flex justify-center mb-8">
          <NexflowLogo size="lg" context="auth" showTagline />
        </div>

        {/* Carte principale */}
        <div
          className="rounded-3xl p-7 sm:p-9"
          style={{
            background: '#fff',
            border:     '1px solid #e5e7eb',
            boxShadow:  '0 20px 60px rgba(15,23,42,0.09)',
          }}
        >
          <Suspense
            fallback={
              <div className="flex flex-col items-center gap-4 py-6">
                <div
                  className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
                />
                <p className="text-sm" style={{ color: '#64748b' }}>Chargement&hellip;</p>
              </div>
            }
          >
            <ActivateContent />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-xs tracking-widest mt-8" style={{ color: '#94a3b8' }}>
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>

      </div>
    </main>
  )
}
