'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { NavHeader } from '@/components/nav-header'
import { supabase } from '@/lib/supabase'
import { getInvitations, type Invitation } from '@/lib/invitations'

/* ── Types ── */

type Member = {
  email: string
  nom?: string
  role?: string
  onboarding_complete?: boolean
  created_at?: string
}

/* ── Helpers ── */

const ROLE_LABELS: Record<string, string> = {
  admin:       'Admin',
  superviseur: 'Superviseur',
  negociateur: 'Négociateur',
}

const ROLE_COLORS: Record<string, string> = {
  admin:       'bg-purple-900/40 text-purple-300 border-purple-700/40',
  superviseur: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  negociateur: 'bg-[#166534]/40 text-[#86efac] border-[#22c55e]/30',
}

function RoleBadge({ role }: { role?: string }) {
  const r   = role ?? 'negociateur'
  const cls = ROLE_COLORS[r] ?? ROLE_COLORS['negociateur']
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {ROLE_LABELS[r] ?? r}
    </span>
  )
}

function SuccessBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#166534]/30 border border-[#22c55e]/30 rounded-xl px-4 py-3 text-[#86efac] text-sm">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-[#22c55e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        {msg}
      </div>
      <button onClick={onClose} className="text-[#86efac]/50 hover:text-[#86efac]">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}

function ErrorBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 text-red-300 text-sm">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        {msg}
      </div>
      <button onClick={onClose} className="text-red-300/50 hover:text-red-300">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}

/* ── Page ── */

export default function Equipe() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [members,     setMembers]     = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading,     setLoading]     = useState(true)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null)

  /* Formulaire invitation */
  const [showForm,    setShowForm]    = useState(false)
  const [invNom,      setInvNom]      = useState('')
  const [invEmail,    setInvEmail]    = useState('')
  const [invRole,     setInvRole]     = useState<'negociateur' | 'superviseur'>('negociateur')
  const [sending,     setSending]     = useState(false)

  /* Confirmation suppression */
  const [confirmMember,     setConfirmMember]     = useState<string | null>(null) // email
  const [confirmInvitation, setConfirmInvitation] = useState<string | null>(null) // id
  const [deleting,          setDeleting]          = useState(false)

  const role = (session as { role?: string } | null)?.role

  /* Redirect si pas admin */
  useEffect(() => {
    if (status === 'loading') return
    if (role && role !== 'admin') router.replace('/')
  }, [status, role, router])

  /* Charger membres et invitations */
  useEffect(() => {
    if (status !== 'authenticated') return
    async function load() {
      setLoading(true)
      const [{ data: users }, invs] = await Promise.all([
        supabase.from('users').select('email, nom, role, onboarding_complete, created_at').order('created_at', { ascending: true }),
        getInvitations(),
      ])
      setMembers((users as Member[]) ?? [])
      setInvitations(invs.filter((i) => !i.accepted))
      setLoading(false)
    }
    load()
  }, [status])

  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault()
    if (!invNom.trim() || !invEmail.trim()) return
    setSending(true)
    setErrorMsg(null)

    const res = await fetch('/api/invitations/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: invNom.trim(), email: invEmail.trim(), role: invRole }),
    })

    const data = await res.json() as { error?: string; warning?: string }
    setSending(false)

    if (data.error) {
      setErrorMsg(data.error)
    } else {
      if (data.warning) {
        setSuccessMsg(`Invitation enregistrée. ${data.warning}`)
      } else {
        setSuccessMsg(`Invitation envoyée à ${invEmail}.`)
      }
      /* Rafraîchir la liste des invitations */
      const invs = await getInvitations()
      setInvitations(invs.filter((i) => !i.accepted))
      /* Réinitialiser formulaire */
      setInvNom(''); setInvEmail(''); setInvRole('negociateur')
      setShowForm(false)
    }
  }

  async function handleDeleteMember(email: string) {
    setDeleting(true)
    const res  = await fetch('/api/members/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json() as { error?: string }
    setDeleting(false)
    setConfirmMember(null)
    if (data.error) {
      setErrorMsg(data.error)
    } else {
      setMembers((prev) => prev.filter((m) => m.email !== email))
      setSuccessMsg('Membre supprimé.')
    }
  }

  async function handleDeleteInvitation(id: string) {
    setDeleting(true)
    const res  = await fetch('/api/invitations/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json() as { error?: string }
    setDeleting(false)
    setConfirmInvitation(null)
    if (data.error) {
      setErrorMsg(data.error)
    } else {
      setInvitations((prev) => prev.filter((i) => i.id !== id))
      setSuccessMsg('Invitation annulée.')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a1a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />
      </div>
    )
  }

  const pendingInvitations = invitations.filter((i) => {
    if (!i.expires_at) return true
    return new Date(i.expires_at) > new Date()
  })

  return (
    <div className="min-h-screen bg-[#0a1a0f] relative">

      {/* Background decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#22c55e]/[0.06] rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-[#22c55e]/[0.04] rounded-full blur-3xl" />
      </div>

      <NavHeader currentPage="equipe" maxWidth="max-w-5xl" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Titre */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[#f0fdf4] text-xl font-bold">Gestion de l&apos;équipe</h1>
            <p className="text-[#4ade80]/50 text-xs mt-0.5">
              {members.length} membre{members.length > 1 ? 's' : ''}
              {pendingInvitations.length > 0 && ` · ${pendingInvitations.length} invitation${pendingInvitations.length > 1 ? 's' : ''} en attente`}
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#0a1a0f] font-semibold text-sm py-2.5 px-5 rounded-xl transition-all hover:scale-[1.02]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Inviter un membre
          </button>
        </div>

        {successMsg && <SuccessBanner msg={successMsg} onClose={() => setSuccessMsg(null)} />}
        {errorMsg   && <ErrorBanner   msg={errorMsg}   onClose={() => setErrorMsg(null)} />}

        {/* Formulaire invitation */}
        {showForm && (
          <div className="bg-white/5 backdrop-blur-xl border border-[#22c55e]/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-[#f0fdf4] font-semibold text-base mb-5">Nouvelle invitation</h2>
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">Nom complet</label>
                  <input
                    value={invNom}
                    onChange={(e) => setInvNom(e.target.value)}
                    placeholder="Marie Dupont"
                    required
                    className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">Adresse email</label>
                  <input
                    type="email"
                    value={invEmail}
                    onChange={(e) => setInvEmail(e.target.value)}
                    placeholder="marie.dupont@agence.com"
                    required
                    className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-2">Rôle</label>
                <div className="flex gap-3">
                  {(['negociateur', 'superviseur'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInvRole(r)}
                      className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-150 capitalize
                        ${invRole === r
                          ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                          : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-[#22c55e]/40 hover:bg-white/5'
                        }`}
                    >
                      {r === 'negociateur' ? 'Négociateur' : 'Superviseur'}
                      <p className="text-xs font-normal opacity-70 mt-0.5">
                        {r === 'negociateur' ? 'Crée des fiches' : 'Tableaux + fiches'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sending || !invNom.trim() || !invEmail.trim()}
                  className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-3 px-6 rounded-xl transition-all"
                >
                  {sending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83"/></svg>
                      Envoi&hellip;
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      Envoyer l&apos;invitation
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setInvNom(''); setInvEmail('') }}
                  className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 hover:border-white/20 hover:text-white transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tableau des membres */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-[#166534]/40 flex items-center justify-center text-[#22c55e]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h2 className="text-[#f0fdf4] font-semibold text-base">Membres actifs</h2>
          </div>

          {members.length === 0 ? (
            <p className="text-[#86efac]/40 text-sm text-center py-12">Aucun membre trouvé.</p>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {members.map((m) => (
                <div key={m.email} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Avatar initiales */}
                    <div className="w-9 h-9 rounded-full bg-[#166534]/50 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e] text-sm font-bold shrink-0">
                      {(m.nom ?? m.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[#f0fdf4] text-sm font-semibold">{m.nom ?? '—'}</p>
                      <p className="text-[#86efac]/50 text-xs">{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={m.role} />
                    {m.email === session?.user?.email ? (
                      <span className="text-xs text-[#86efac]/40 italic">vous</span>
                    ) : confirmMember === m.email ? (
                      /* Confirmation inline */
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-300">Confirmer ?</span>
                        <button
                          onClick={() => handleDeleteMember(m.email)}
                          disabled={deleting}
                          className="text-xs bg-red-900/40 hover:bg-red-900/70 text-red-300 border border-red-700/50 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                        >
                          {deleting ? '…' : 'Oui'}
                        </button>
                        <button
                          onClick={() => setConfirmMember(null)}
                          disabled={deleting}
                          className="text-xs text-white/40 hover:text-white border border-white/10 px-2.5 py-1 rounded-lg transition-all"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmMember(m.email)}
                        className="text-xs text-red-400/60 hover:text-red-400 border border-red-800/30 hover:border-red-600/50 px-2.5 py-1 rounded-lg transition-all"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invitations en attente */}
        {pendingInvitations.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
              <div className="w-8 h-8 rounded-lg bg-[#166534]/40 flex items-center justify-center text-[#22c55e]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <h2 className="text-[#f0fdf4] font-semibold text-base">
                Invitations en attente
                <span className="ml-2 bg-[#166534]/50 text-[#86efac] text-xs px-2 py-0.5 rounded-full border border-[#22c55e]/20">
                  {pendingInvitations.length}
                </span>
              </h2>
            </div>
            <div className="divide-y divide-white/[0.07]">
              {pendingInvitations.map((inv) => {
                const expiresAt = inv.expires_at ? new Date(inv.expires_at) : null
                const isExpired = expiresAt ? expiresAt < new Date() : false
                return (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/30 text-sm font-bold shrink-0">
                        {inv.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[#f0fdf4] text-sm font-semibold">{inv.nom}</p>
                        <p className="text-[#86efac]/50 text-xs">{inv.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={inv.role} />
                      {isExpired ? (
                        <span className="text-xs text-red-400/70 bg-red-900/20 border border-red-700/30 px-2 py-0.5 rounded-full">
                          Expirée
                        </span>
                      ) : (
                        <span className="text-xs text-[#86efac]/40">
                          Expire le {expiresAt?.toLocaleDateString('fr-FR') ?? '—'}
                        </span>
                      )}
                      {confirmInvitation === inv.id ? (
                        /* Confirmation inline */
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-300">Confirmer ?</span>
                          <button
                            onClick={() => handleDeleteInvitation(inv.id!)}
                            disabled={deleting}
                            className="text-xs bg-red-900/40 hover:bg-red-900/70 text-red-300 border border-red-700/50 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                          >
                            {deleting ? '…' : 'Oui'}
                          </button>
                          <button
                            onClick={() => setConfirmInvitation(null)}
                            disabled={deleting}
                            className="text-xs text-white/40 hover:text-white border border-white/10 px-2.5 py-1 rounded-lg transition-all"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmInvitation(inv.id ?? null)}
                          className="text-xs text-red-400/60 hover:text-red-400 border border-red-800/30 hover:border-red-600/50 px-2.5 py-1 rounded-lg transition-all"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center text-[#15803d] text-xs tracking-widest py-8">
        &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
      </footer>
    </div>
  )
}
