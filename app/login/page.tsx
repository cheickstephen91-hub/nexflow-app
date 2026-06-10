'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getUserProfile } from '@/lib/user-profile'

type Mode = 'login' | 'signup'

export default function Login() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [mode, setMode]         = useState<Mode>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  /* Redirect if already authenticated */
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
      const result = await signIn('credentials', {
        email,
        password,
        nom,
        mode,
        redirect: false,
      })

      if (result?.error) {
        /* NextAuth v4 transmet le message de throw directement */
        setError(result.error === 'CredentialsSignin'
          ? (mode === 'signup' ? 'Erreur lors de la cr&eacute;ation du compte.' : 'Email ou mot de passe incorrect.')
          : result.error
        )
      } else if (result?.ok) {
        window.location.href = '/'
      }
    } catch {
      setError('Une erreur inattendue s\'est produite.')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setPassword('')
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-[#0a1a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a1a0f] relative flex flex-col items-center justify-center px-4">

      {/* Background decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#22c55e]/[0.07] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[#22c55e]/[0.05] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#166534]/[0.06] rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 text-center">
        <span style={{ fontWeight: 700, fontSize: '28px', color: '#ffffff' }}>Nex</span>
        <span style={{ fontWeight: 700, fontSize: '28px', color: '#22c55e' }}>flow</span>
        <div style={{ fontSize: '9px', color: '#9CA3AF', letterSpacing: '3px', marginTop: '2px' }}>DIGITAL SOLUTIONS</div>
      </div>

      {/* Card glassmorphism */}
      <div className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

        {/* Tabs */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                mode === m
                  ? 'bg-[#22c55e] text-[#0a1a0f] shadow-md shadow-[#22c55e]/30'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {m === 'login' ? 'Se connecter' : 'S\'inscrire'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-700/40 rounded-xl px-3.5 py-3 mb-4">
            <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <p className="text-red-300 text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: error }}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nom (signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">
                Nom complet
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Jean Dupont"
                className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Minimum 8 caractères' : '••••••••'}
              required
              minLength={mode === 'signup' ? 8 : 1}
              className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#22c55e]/20"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
              </svg>
            ) : null}
            {loading
              ? (mode === 'signup' ? 'Création du compte...' : 'Connexion...')
              : (mode === 'signup' ? 'Créer mon compte' : 'Se connecter')
            }
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/20 text-xs">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/', redirect: true })}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm py-3 rounded-xl transition-all duration-200 hover:scale-[1.01] shadow-md shadow-black/20 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuer avec Google
        </button>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-8 text-[#15803d] text-xs tracking-widest">
        &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
      </p>
    </main>
  )
}
