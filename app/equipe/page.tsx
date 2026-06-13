'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getInvitations, type Invitation } from '@/lib/invitations'
import { AppHeader } from '@/components/ui/nexflow'

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
  directeur:     'Directeur',
  manager:       'Manager',
  collaborateur: 'Collaborateur',
}

const ROLE_COLORS: Record<string, React.CSSProperties> = {
  directeur:     { background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)' },
  manager:       { background: '#ede9fe', color: '#7c3aed', border: '1px solid #ddd6fe' },
  collaborateur: { background: 'color-mix(in srgb, var(--success) 12%, transparent)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)' },
}

function RoleBadge({ role }: { role?: string }) {
  const r = role ?? 'collaborateur'
  const s = ROLE_COLORS[r] ?? ROLE_COLORS['collaborateur']
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={s}>
      {ROLE_LABELS[r] ?? r}
    </span>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={active
        ? { background: 'color-mix(in srgb, var(--success) 12%, transparent)', color: 'var(--success)' }
        : { background: 'var(--secondary)', color: 'var(--muted-foreground)' }
      }
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: active ? 'var(--success)' : 'var(--muted-foreground)' }} />
      {active ? 'Actif' : 'En attente'}
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

  /* Recherche */
  const [searchQuery, setSearchQuery] = useState('')

  /* Formulaire invitation */
  const [showForm, setShowForm] = useState(false)
  const [invNom,   setInvNom]   = useState('')
  const [invEmail, setInvEmail] = useState('')
  const [invRole,  setInvRole]  = useState<'collaborateur' | 'manager'>('collaborateur')
  const [sending,  setSending]  = useState(false)

  /* Confirmation suppression */
  const [confirmMember,     setConfirmMember]     = useState<string | null>(null)
  const [confirmInvitation, setConfirmInvitation] = useState<string | null>(null)
  const [deleting,          setDeleting]          = useState(false)

  /* Édition de rôle */
  const [editRoleMember, setEditRoleMember] = useState<string | null>(null)
  const [editRoleValue,  setEditRoleValue]  = useState<string>('')
  const [savingRole,     setSavingRole]     = useState(false)

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

  /* Membres filtrés par recherche */
  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (m.nom ?? '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  })

  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault()
    if (!invNom.trim() || !invEmail.trim()) return
    setSending(true)
    setErrorMsg(null)
    const res  = await fetch('/api/invitations/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: invNom.trim(), email: invEmail.trim(), role: invRole }),
    })
    const data = await res.json() as { error?: string; warning?: string }
    setSending(false)
    if (data.error) {
      setErrorMsg(data.error)
    } else {
      setSuccessMsg(data.warning ? `Invitation enregistrée. ${data.warning}` : `Invitation envoyée à ${invEmail}.`)
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
    if (data.error) { setErrorMsg(data.error) }
    else { setMembers((prev) => prev.filter((m) => m.email !== email)); setSuccessMsg('Membre supprimé.') }
  }

  async function handleUpdateRole(email: string, newRole: string) {
    setSavingRole(true)
    const res  = await fetch('/api/members/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: newRole }),
    })
    const data = await res.json() as { error?: string }
    setSavingRole(false)
    setEditRoleMember(null)
    if (data.error) { setErrorMsg(data.error) }
    else { setMembers((prev) => prev.map((m) => m.email === email ? { ...m, role: newRole } : m)); setSuccessMsg('Rôle mis à jour.') }
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
    if (data.error) { setErrorMsg(data.error) }
    else { setInvitations((prev) => prev.filter((i) => i.id !== id)); setSuccessMsg('Invitation annulée.') }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const pendingInvitations = invitations.filter((i) => {
    if (!i.expires_at) return true
    return new Date(i.expires_at) > new Date()
  })

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--background)' }}>

      {/* Background decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--success) 6%, transparent)' }} />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full blur-3xl" style={{ background: 'color-mix(in srgb, var(--success) 4%, transparent)' }} />
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <AppHeader
          title="Gestion de l'équipe"
          subtitle={`${members.length} membre${members.length > 1 ? 's' : ''}${pendingInvitations.length > 0 ? ` · ${pendingInvitations.length} invitation${pendingInvitations.length > 1 ? 's' : ''} en attente` : ''}`}
          actions={
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 font-semibold text-sm py-2.5 px-5 rounded-xl transition-all hover:scale-[1.02]"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-hover)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Inviter un membre
            </button>
          }
        />

        {successMsg && <SuccessBanner msg={successMsg} onClose={() => setSuccessMsg(null)} />}
        {errorMsg   && <ErrorBanner   msg={errorMsg}   onClose={() => setErrorMsg(null)} />}

        {/* Formulaire invitation */}
        {showForm && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <h2 className="font-semibold text-base mb-5" style={{ color: 'var(--foreground)' }}>Nouvelle invitation</h2>
            <form onSubmit={handleSendInvitation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widests uppercase mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Nom complet</label>
                  <input
                    value={invNom}
                    onChange={(e) => setInvNom(e.target.value)}
                    placeholder="Marie Dupont"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widests uppercase mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Adresse email</label>
                  <input
                    type="email"
                    value={invEmail}
                    onChange={(e) => setInvEmail(e.target.value)}
                    placeholder="marie.dupont@agence.com"
                    required
                    className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                    style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-widests uppercase mb-2" style={{ color: 'var(--muted-foreground)' }}>Rôle</label>
                <div className="flex gap-3">
                  {(['collaborateur', 'manager'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInvRole(r)}
                      className="flex-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-150 capitalize"
                      style={invRole === r
                        ? { borderColor: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 10%, transparent)', color: 'var(--primary)' }
                        : { borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }
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
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
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
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tableau des membres */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
          {/* Header + recherche */}
          <div className="px-6 py-4 space-y-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h2 className="font-semibold text-base flex-1" style={{ color: 'var(--foreground)' }}>Membres actifs</h2>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom ou email…"
                className="w-full rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none transition-all"
                style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: 'var(--muted-foreground)' }}>
              {searchQuery ? 'Aucun membre ne correspond à la recherche.' : 'Aucun membre trouvé.'}
            </p>
          ) : (
            <div>
              {filteredMembers.map((m, idx) => (
                <div
                  key={m.email}
                  className="flex items-center justify-between px-6 py-4 transition-colors"
                  style={{ borderBottom: idx < filteredMembers.length - 1 ? '1px solid var(--border)' : undefined }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--secondary)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '' }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                      {(m.nom ?? m.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{m.nom ?? '—'}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>{m.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <StatusBadge active={!!m.onboarding_complete} />
                    <RoleBadge role={m.role} />

                    {m.email === session?.user?.email ? (
                      <span className="text-xs italic" style={{ color: 'var(--muted-foreground)' }}>vous</span>
                    ) : editRoleMember === m.email ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editRoleValue}
                          onChange={(e) => setEditRoleValue(e.target.value)}
                          className="rounded-lg px-2 py-1 text-xs outline-none"
                          style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                          autoFocus
                        >
                          <option value="collaborateur">Collaborateur</option>
                          <option value="manager">Manager</option>
                          <option value="directeur">Directeur</option>
                        </select>
                        <button
                          onClick={() => handleUpdateRole(m.email, editRoleValue)}
                          disabled={savingRole || editRoleValue === m.role}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                          style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', color: 'var(--primary)' }}
                        >
                          {savingRole ? '…' : 'OK'}
                        </button>
                        <button
                          onClick={() => setEditRoleMember(null)}
                          disabled={savingRole}
                          className="text-xs px-2 py-1 rounded-lg transition-all"
                          style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                        >
                          ✕
                        </button>
                      </div>
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
                          style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setEditRoleMember(m.email); setEditRoleValue(m.role ?? 'collaborateur') }}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all"
                          style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)' }}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => setConfirmMember(m.email)}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all"
                          style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.6)' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--destructive)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.6)' }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.6)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)' }}
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invitations en attente */}
        {pendingInvitations.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <h2 className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
                Invitations en attente{' '}
                <span className="ml-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--primary) 12%, transparent)', color: 'var(--primary)' }}>
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
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'var(--secondary)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                        {inv.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{inv.nom}</p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{inv.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <RoleBadge role={inv.role} />
                      {isExpired ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--destructive)' }}>
                          Expirée
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
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
                            style={{ border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
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

      <footer className="text-center text-xs tracking-widest py-8" style={{ color: 'var(--muted-foreground)' }}>
        &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
      </footer>
    </div>
  )
}
