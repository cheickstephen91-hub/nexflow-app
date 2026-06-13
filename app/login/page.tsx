'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getUserProfile } from '@/lib/user-profile'
import { NexflowLogo } from '@/components/ui/nexflow/nexflow-logo'

/* ─────────────────────────────────────────────────────────
   Login page — Nexflow v2
   Logique métier 100% identique à l'original.
   Seule la couche UI est redesignée.
───────────────────────────────────────────────────────── */

type Mode = 'login' | 'signup'

/* ── Icônes champs ── */
const IcoUser = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const IcoMail = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
)
const IcoLock = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
)
const IcoAlert = (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
)
const IcoSpin = (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
)

/* ── InputField ── */
function InputField({
  id, label, type, value, onChange, placeholder, required, minLength, icon,
}: {
  id: string; label: string; type: string; value: string
  onChange: (v: string) => void; placeholder: string
  required?: boolean; minLength?: number; icon: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
      </label>
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200"
        style={{
          background:  'var(--input)',
          border:      `1.5px solid ${focused ? 'var(--ring)' : 'var(--input-border)'}`,
          boxShadow:   focused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
        }}
      >
        <span style={{ color: focused ? 'var(--primary)' : 'var(--muted-foreground)' }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--foreground)' }}
        />
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function Login() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  /* Redirect if already authenticated — logique inchangée */
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return
    getUserProfile(session.user.email).then((profile) => {
      router.replace(profile?.onboarding_complete ? '/' : '/onboarding')
    })
  }, [status, session, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, nom, mode, redirect: false })
      if (result?.error) {
        setError(result.error === 'CredentialsSignin'
          ? (mode === 'signup' ? 'Erreur lors de la création du compte.' : 'Email ou mot de passe incorrect.')
          : result.error
        )
      } else if (result?.ok) {
        window.location.href = '/'
      }
    } catch {
      setError("Une erreur inattendue s'est produite.")
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setPassword('')
  }

  /* ── Loading screen ── */
  if (status === 'loading') {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--background)' }}
      >
        <div
          className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
        />
      </main>
    )
  }

  /* ── Main render ── */
  return (
    <main
      className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'var(--background)' }}
    >

      {/* ── Arrière-plan décoratif ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Blob haut-gauche */}
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        />
        {/* Blob bas-droite */}
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        />
        {/* Grille décorative — visible en light mode */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.015]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" style={{ color: 'var(--foreground)' }}/>
        </svg>
      </div>

      {/* ── Logo ── */}
      <div className="relative z-10 mb-8">
        <NexflowLogo size="lg" context="auth" showTagline />
      </div>

      {/* ── Card ── */}
      <div
        className="relative z-10 w-full max-w-sm"
        style={{
          background:   'var(--card)',
          border:       '1px solid var(--border)',
          borderRadius: '1.25rem',
          boxShadow:    'var(--shadow-modal)',
          padding:      '1.75rem',
        }}
      >
        {/* ── Onglets ── */}
        <div
          className="flex p-1 rounded-xl mb-6"
          style={{ background: 'var(--secondary)', gap: 4 }}
        >
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={mode === m
                ? {
                    background: 'var(--primary)',
                    color:      'var(--primary-foreground)',
                    boxShadow:  '0 2px 8px rgba(37,99,235,0.35)',
                  }
                : {
                    background: 'transparent',
                    color:      'var(--muted-foreground)',
                  }
              }
              onMouseEnter={(e) => {
                if (mode !== m) (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'
              }}
              onMouseLeave={(e) => {
                if (mode !== m) (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'
              }}
            >
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {/* ── Titre contextuel ── */}
        <div className="mb-5">
          <h1
            className="text-lg font-bold"
            style={{ color: 'var(--foreground)' }}
          >
            {mode === 'login' ? 'Bon retour 👋' : 'Créer un compte'}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {mode === 'login'
              ? 'Connectez-vous à votre espace Nexflow'
              : 'Rejoignez Nexflow pour gérer vos fiches'}
          </p>
        </div>

        {/* ── Erreur ── */}
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 mb-4"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border:     '1px solid rgba(239,68,68,0.3)',
            }}
          >
            <span style={{ color: 'var(--destructive)', marginTop: 1 }}>{IcoAlert}</span>
            <p
              className="text-xs leading-relaxed"
              style={{ color: 'var(--destructive)' }}
              dangerouslySetInnerHTML={{ __html: error }}
            />
          </div>
        )}

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nom (signup uniquement) */}
          {mode === 'signup' && (
            <InputField
              id="login-nom"
              label="Nom complet"
              type="text"
              value={nom}
              onChange={setNom}
              placeholder="Jean Dupont"
              icon={IcoUser}
            />
          )}

          {/* Email */}
          <InputField
            id="login-email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="vous@exemple.com"
            required
            icon={IcoMail}
          />

          {/* Mot de passe */}
          <InputField
            id="login-password"
            label="Mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === 'signup' ? 'Minimum 8 caractères' : '••••••••'}
            required
            minLength={mode === 'signup' ? 8 : 1}
            icon={IcoLock}
          />

          {/* Bouton principal — forme pilule */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-200 mt-1"
            style={{
              background:   loading || !email || !password ? 'var(--muted)' : 'var(--primary)',
              color:        loading || !email || !password ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
              borderRadius: '9999px',
              padding:      '0.875rem 1.5rem',
              cursor:       loading || !email || !password ? 'not-allowed' : 'pointer',
              boxShadow:    loading || !email || !password ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
            }}
            onMouseEnter={(e) => {
              if (!loading && email && password) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-hover)'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && email && password) {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary)'
                ;(e.currentTarget as HTMLButtonElement).style.transform = ''
              }
            }}
          >
            {loading && IcoSpin}
            {loading
              ? (mode === 'signup' ? 'Création du compte...' : 'Connexion...')
              : (mode === 'signup' ? 'Créer mon compte' : 'Se connecter')
            }
          </button>
        </form>

        {/* ── Séparateur ── */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>ou</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* ── Bouton Google — forme pilule ── */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/', redirect: true })}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 text-sm font-semibold transition-all duration-200 disabled:opacity-60"
          style={{
            background:   'var(--card)',
            color:        'var(--foreground)',
            border:       '1.5px solid var(--border)',
            borderRadius: '9999px',
            padding:      '0.75rem 1.5rem',
            boxShadow:    '0 1px 4px rgba(0,0,0,0.08)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--secondary)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = ''
            }
          }}
        >
          {/* Google logo SVG officiel */}
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>
      </div>

      {/* ── Footer copyright ── */}
      <p
        className="relative z-10 mt-8 text-xs tracking-widest"
        style={{ color: 'var(--muted-foreground)' }}
      >
        &copy; {new Date().getFullYear()} NEXFLOW &middot; DIGITAL SOLUTIONS
      </p>

    </main>
  )
}
