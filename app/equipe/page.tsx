'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
// NavHeader replaced by Sidebar via AppShell
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
  directeur:    'Directeur',
  manager:      'Manager',
  collaborateur: 'Collaborateur',
}

const ROLE_STYLES: Record<string, React.CSSProperties> = {
  directeur:    { background: '#dbeafe', color: '#1d4ed8' },
  manager:      { background: '#ede9fe', color: '#7c3aed' },
  collaborateur: { background: '#dcfce7', color: '#16a34a' },
}

function RoleBadge({ role }: { role?: string }) {
  const r = role ?? 'collaborateur'
  const s = ROLE_STYLES[r] ?? ROLE_STYLES['collaborateur']
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={s}>
      {ROLE_LABELS[r] ?? r}
    </span>
  )
}

function SuccessBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(22,101,52,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--success)' }}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        {msg}
      </div>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  )
}

function ErrorBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(153,27,27,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--destructive)' }}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        {msg}
      </div>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
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
  const [invRole,     setInvRole]     = useState<'collaborateur' | 'manager'>('collaborateur')
  const [sending,     setSending]     = useState(false)

  /* Confirmation suppression */
  const [confirmMember,     setConfirmMember]     = useState<string | null>(null)
  const [confirmInvitation, setConfirmInvitation] = useState<string | null>(null)
  const [deleting,          setDeleting]          = useState(false)

  const role = (session as { role?: string } | null)?.role

  useEffect(() => {
    if (status === 'loading') return
    if (role && role !== 'directeur') router.replace('/')
  }, [status, role, router])

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
      const invs = await getInvitations()
      setInvitations(invs.filter((i) => !i.accepted))
      setInvNom(''); setInvEmail(''); setInvRole('collaborateur')
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const pendingInvitations = invitations.filter((i) => {
    if (!i.expires_at) return true
    return new Date(i.expires_at) > new Date()
  })

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>

      {/* Background decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'rgba(34,197,94,0.06)' }} />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: 'rgba(34,197,94,0.04)' }} />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Titre */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Gestion de l&apos;équipe</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {members.length} membre{members.length > 1 ? 's' : ''}
              {pendingInvitations.length > 0 && ` · ${pendingInvitations.length} invitation${pendingInvitations.length > 1 ? 's' : ''} en attente`}
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 font-semibold text-sm py-2.5 px-5 rounded-xl transition-all hover:scale-[1.02]"
            style={{ background: 'var(--accent)', color: '#ffffff' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-hover)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)' }}
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
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <h2 className="font-semibold text-base mb-5" style={{ color: 'var(--text-primary)' }}>Nouvelle invitation</h2>
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Nom complet</label>
                  <input
                    value={invNom}
                    onChange={(e) => setInvNom(e.target.value)}
                    placeholder="Marie Dupont"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5" style={{ color: 'var(--text-secondary)' }}>Adresse email</label>
                  <input
                    type="email"
                    value={invEmail}
                    onChange={(e) => setInvEmail(e.target.value)}
                    placeholder="marie.dupont@agence.com"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widests uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>Rôle</label>
                <div className="flex gap-3">
                  {(['collaborateur', 'manager'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInvRole(r)}
                      className="flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-150 capitalize"
                      style={invRole === r
                        ? { borderColor: 'var(--accent)', background: 'var(--accent-light)', color: 'var(--accent)' }
                        : { borderColor: 'var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)' }
                      }
                    >
                      {r === 'collaborateur' ? 'Collaborateur' : 'Manager'}
                      <p className="text-xs font-normal opacity-70 mt-0.5">
                        {r === 'collaborateur' ? 'Crée des fiches' : 'Tableaux + fiches'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sending || !invNom.trim() || !invEmail.trim()}
                  className="flex items-center gap-2 font-semibold text-sm py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: '#ffffff' }}
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
                  className="px-5 py-3 rounded-xl text-sm transition-all"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tableau des membres */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>Membres actifs</h2>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>Aucun membre trouvé.</p>
          ) : (
            <div>
              {members.map((m, idx) => (
                <div
                  key={m.email}
                  className="flex items-center justify-between px-6 py-4 transition-colors"
                  style={{ borderBottom: idx < members.length - 1 ? '1px solid var(--border)' : undefined }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-card-hover)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      {(m.nom ?? m.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.nom ?? '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RoleBadge role={m.role} />
                    {m.email === session?.user?.email ? (
                      <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>vous</span>
                    ) : confirmMember === m.email ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--destructive)' }}>Confirmer ?</span>
                        <button
                          onClick={() => handleDeleteMember(m.email)}
                          disabled={deleting}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--destructive)' }}
                        >
                          {deleting ? '…' : 'Oui'}
                        </button>
                        <button
                          onClick={() => setConfirmMember(null)}
                          disabled={deleting}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmMember(m.email)}
                        className="text-xs px-2.5 py-1 rounded-lg transition-all"
                        style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.6)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.6)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.6)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)' }}
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
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <h2 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                Invitations en attente{' '}
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                  {pendingInvitations.length}
                </span>
              </h2>
            </div>
            <div>
              {pendingInvitations.map((inv, idx) => {
                const expiresAt = inv.expires_at ? new Date(inv.expires_at) : null
                const isExpired = expiresAt ? expiresAt < new Date() : false
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: idx < pendingInvitations.length - 1 ? '1px solid var(--border)' : undefined }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        {inv.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{inv.nom}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{inv.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={inv.role} />
                      {isExpired ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--destructive)' }}>
                          Expirée
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Expire le {expiresAt?.toLocaleDateString('fr-FR') ?? '—'}
                        </span>
                      )}
                      {confirmInvitation === inv.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: 'var(--destructive)' }}>Confirmer ?</span>
                          <button
                            onClick={() => handleDeleteInvitation(inv.id!)}
                            disabled={deleting}
                            className="text-xs px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--destructive)' }}
                          >
                            {deleting ? '…' : 'Oui'}
                          </button>
                          <button
                            onClick={() => setConfirmInvitation(null)}
                            disabled={deleting}
                            className="text-xs px-2.5 py-1 rounded-lg transition-all"
                            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmInvitation(inv.id ?? null)}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all"
                          style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.6)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.6)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.6)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)' }}
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

      <footer className="text-center text-xs tracking-widest py-8" style={{ color: 'var(--text-muted)' }}>
        &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
      </footer>
    </div>
  )
}
