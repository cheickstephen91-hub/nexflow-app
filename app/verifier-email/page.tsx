'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams }                from 'next/navigation'
import Link                               from 'next/link'
import { NexflowLogo }                   from '@/components/ui/nexflow'

/* ── Icônes ── */
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
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IcoMail = (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
)

type Status = 'loading' | 'success' | 'expired' | 'already_verified' | 'invalid' | 'no_token'

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

function VerifyContent() {
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [status,    setStatus]    = useState<Status>('loading')
  const [email,     setEmail]     = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)

  useEffect(() => {
    if (!token) { setStatus('no_token'); return }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: { success?: boolean; error?: string; email?: string }) => {
        if (data.success) {
          setStatus('success')
          setEmail(data.email ?? null)
        } else {
          setEmail(data.email ?? null)
          if (data.error === 'expired')           setStatus('expired')
          else if (data.error === 'already_verified') setStatus('already_verified')
          else                                    setStatus('invalid')
        }
      })
      .catch(() => setStatus('invalid'))
  }, [token])

  async function handleResend() {
    if (!email || resending) return
    setResending(true)
    await fetch('/api/auth/send-verification', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })
    setResending(false)
    setResent(true)
  }

  /* ── Loading ── */
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
        />
        <p className="text-sm font-medium" style={{ color: '#64748b' }}>Vérification en cours&hellip;</p>
      </div>
    )
  }

  /* ── Succès ── */
  if (status === 'success') {
    return (
      <StatusCard
        icon={IcoCheck}
        iconBg="#eff6ff"
        iconColor="#2563eb"
        title="Email vérifié !"
        description="Votre adresse email a été confirmée. Vous pouvez maintenant vous connecter à Nexflow."
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 mt-6 rounded-full text-sm font-bold text-white px-6 py-3 transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 6px 20px rgba(37,99,235,0.30)' }}
        >
          Se connecter →
        </Link>
      </StatusCard>
    )
  }

  /* ── Déjà vérifié ── */
  if (status === 'already_verified') {
    return (
      <StatusCard
        icon={IcoCheck}
        iconBg="#f0fdf4"
        iconColor="#16a34a"
        title="Email déjà vérifié"
        description="Votre adresse email est déjà confirmée. Vous pouvez vous connecter directement."
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 mt-6 rounded-full text-sm font-bold text-white px-6 py-3 transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 6px 20px rgba(37,99,235,0.30)' }}
        >
          Se connecter →
        </Link>
      </StatusCard>
    )
  }

  /* ── Expiré ── */
  if (status === 'expired') {
    return (
      <StatusCard
        icon={IcoClock}
        iconBg="#fff7ed"
        iconColor="#ea580c"
        title="Lien expiré"
        description="Ce lien de vérification a expiré (validité : 24h). Demandez-en un nouveau ci-dessous."
      >
        <div className="mt-6 space-y-3">
          {resent ? (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}
            >
              ✓ Nouvel email envoyé — vérifiez votre boîte.
            </div>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full rounded-full text-sm font-bold py-3 px-6 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', boxShadow: '0 6px 20px rgba(37,99,235,0.25)' }}
            >
              {resending ? 'Envoi…' : 'Renvoyer l\'email de vérification'}
            </button>
          )}
          <Link href="/login" className="block text-sm text-center" style={{ color: '#64748b' }}>
            ← Retour à la connexion
          </Link>
        </div>
      </StatusCard>
    )
  }

  /* ── Invalide / no_token ── */
  return (
    <StatusCard
      icon={IcoCross}
      iconBg="#fef2f2"
      iconColor="#dc2626"
      title="Lien invalide"
      description="Ce lien de vérification est invalide ou introuvable. Vérifiez que vous avez copié l'URL complète."
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

/* ── Page wrapper ── */
export default function VerifierEmail() {
  return (
    <main
      className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #f8fafc 100%)' }}
    >
      {/* Blobs décoratifs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }}
        />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8">
        <NexflowLogo size="lg" context="auth" showTagline />
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm"
        style={{
          background:   '#ffffff',
          border:       '1px solid #e2e8f0',
          borderRadius: '1.25rem',
          boxShadow:    '0 8px 40px rgba(37,99,235,0.10)',
          padding:      '2rem',
        }}
      >
        {/* Icône email en haut */}
        <div className="flex justify-center mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
          >
            {IcoMail}
          </div>
        </div>

        <Suspense fallback={
          <div className="flex flex-col items-center gap-4 py-6">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }}
            />
          </div>
        }>
          <VerifyContent />
        </Suspense>
      </div>

      <p className="relative z-10 mt-8 text-xs tracking-widest" style={{ color: '#94a3b8' }}>
        &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
      </p>
    </main>
  )
}
