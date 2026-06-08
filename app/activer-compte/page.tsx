'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getInvitationByToken, acceptInvitation, type Invitation } from '@/lib/invitations'
import bcrypt from 'bcryptjs'

/* ── Contenu principal (séparé pour Suspense) ── */

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

  /* Charger l'invitation */
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

  /* ── États ── */

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />
        <p className="text-[#86efac]/60 text-sm">Vérification du lien&hellip;</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-red-900/30 border border-red-700/40 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 className="text-[#f0fdf4] font-bold text-lg mb-2">Lien invalide</h2>
        <p className="text-[#86efac]/50 text-sm">Ce lien d&apos;invitation est invalide ou introuvable.</p>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-orange-900/30 border border-orange-700/40 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className="text-[#f0fdf4] font-bold text-lg mb-2">Lien expiré</h2>
        <p className="text-[#86efac]/50 text-sm">Ce lien d&apos;invitation a expiré. Demandez un nouvel envoi à votre administrateur.</p>
      </div>
    )
  }

  if (status === 'used') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-[#166534]/40 border border-[#22c55e]/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 className="text-[#f0fdf4] font-bold text-lg mb-2">Compte déjà activé</h2>
        <p className="text-[#86efac]/50 text-sm mb-6">Cette invitation a déjà été utilisée.</p>
        <a href="/login" className="text-[#22c55e] text-sm hover:underline">Se connecter &rarr;</a>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-[#166534]/40 border border-[#22c55e]/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 className="text-[#f0fdf4] font-bold text-lg mb-2">Compte activé !</h2>
        <p className="text-[#86efac]/60 text-sm">Redirection vers la page de connexion&hellip;</p>
      </div>
    )
  }

  /* ── Formulaire d'activation ── */
  const ROLE_LABELS: Record<string, string> = {
    negociateur: 'Négociateur', superviseur: 'Superviseur', admin: 'Administrateur',
  }

  return (
    <div>
      <h2 className="text-[#f0fdf4] font-bold text-xl mb-1">Activer votre compte</h2>
      <p className="text-[#86efac]/50 text-xs mb-6">Choisissez un mot de passe pour finaliser votre inscription</p>

      {/* Info rôle */}
      <div className="flex items-center gap-2 bg-[#166534]/20 border border-[#22c55e]/20 rounded-xl px-4 py-2.5 mb-5">
        <svg className="w-4 h-4 text-[#22c55e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
        <div className="text-xs text-[#86efac]">
          Invité en tant que&nbsp;
          <span className="text-[#22c55e] font-semibold">
            {ROLE_LABELS[invitation?.role ?? ''] ?? invitation?.role}
          </span>
        </div>
      </div>

      <form onSubmit={handleActivate} className="space-y-4">
        {/* Email (lecture seule) */}
        <div>
          <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">Email</label>
          <input
            type="email"
            value={invitation?.email ?? ''}
            readOnly
            className="w-full bg-white/[0.03] border border-white/10 text-white/40 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
          />
        </div>

        {/* Nom (lecture seule) */}
        <div>
          <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">Nom</label>
          <input
            type="text"
            value={invitation?.nom ?? ''}
            readOnly
            className="w-full bg-white/[0.03] border border-white/10 text-white/40 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
          />
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">Mot de passe</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 caractères"
              required
              className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4ade80]/50 hover:text-[#4ade80] transition-colors p-1"
            >
              {showPwd ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirmer mot de passe */}
        <div>
          <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">Confirmer le mot de passe</label>
          <input
            type={showPwd ? 'text' : 'password'}
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            placeholder="Répéter le mot de passe"
            required
            className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !password || !confirmPass}
          className="w-full flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 mt-2"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>
              Activation&hellip;
            </>
          ) : 'Activer mon compte'}
        </button>
      </form>
    </div>
  )
}

/* ── Page wrapper ── */

export default function ActiverCompte() {
  return (
    <main className="min-h-screen bg-[#0a1a0f] relative flex flex-col items-center justify-center px-4 py-10">

      {/* Background decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#22c55e]/[0.07] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[#22c55e]/[0.05] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div>
            <span style={{ fontWeight: 700, fontSize: '22px', color: '#ffffff' }}>Nex</span>
            <span style={{ fontWeight: 700, fontSize: '22px', color: '#22c55e' }}>flow</span>
            <div style={{ fontSize: '9px', color: '#9CA3AF', letterSpacing: '3px', textAlign: 'center' }}>DIGITAL SOLUTIONS</div>
          </div>
        </div>

        {/* Card glassmorphism */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />
            </div>
          }>
            <ActivateContent />
          </Suspense>
        </div>

        <p className="text-center text-[#15803d] text-xs tracking-widest mt-8">
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </div>
    </main>
  )
}
