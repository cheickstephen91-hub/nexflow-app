'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import {
  getUserProfile, upsertUserProfile, uploadLogo,
  getAgents, addAgent, deleteAgent,
  type UserProfile, type Agent,
} from '@/lib/user-profile'
// NavHeader replaced by Sidebar via AppShell

/* ── helpers UI ── */

function SectionCard({ id, title, icon, children }: {
  id?: string; title: string; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div id={id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] scroll-mt-20">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-[#166534]/40 flex items-center justify-center text-[#22c55e]">
          {icon}
        </div>
        <h2 className="text-[#f0fdf4] font-semibold text-base">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">{children}</label>
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
    />
  )
}

function SaveButton({ onClick, loading, label = 'Enregistrer' }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-2.5 px-5 rounded-xl transition-all duration-200 hover:scale-[1.02]"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
      )}
      {loading ? 'Enregistrement...' : label}
    </button>
  )
}

function SuccessBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-[#166534]/30 border border-[#22c55e]/30 rounded-xl px-4 py-3">
      <svg className="w-4 h-4 text-[#22c55e] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <p className="text-[#86efac] text-xs flex-1">{msg}</p>
      <button onClick={onClose} className="text-[#86efac]/40 hover:text-[#86efac] transition-colors">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}

function ErrorBanner({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-red-950/40 border border-red-700/40 rounded-xl px-4 py-3">
      <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
      </svg>
      <p className="text-red-300 text-xs flex-1">{msg}</p>
      <button onClick={onClose} className="text-red-400/40 hover:text-red-400 transition-colors">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}

/* ── Page principale ── */

export default function Parametres() {
  const { data: session, status } = useSession()
  const email = session?.user?.email ?? ''

  /* Profile state */
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [loadingProfile, setLoadingProfile] = useState(true)

  /* Sections loading/success/error */
  const [savingIdentite, setSavingIdentite] = useState(false)
  const [savingInfos, setSavingInfos] = useState(false)
  const [savingRapport, setSavingRapport] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  /* Logo */
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* Agents */
  const [agents, setAgents] = useState<Agent[]>([])
  const [newAgentNom, setNewAgentNom] = useState('')
  const [newAgentRole, setNewAgentRole] = useState('')
  const [addingAgent, setAddingAgent] = useState(false)

  /* Load profile on mount */
  useEffect(() => {
    if (!email) return
    Promise.all([getUserProfile(email), getAgents(email)]).then(([p, a]) => {
      if (p) setProfile(p)
      if (p?.logo_url) setLogoPreview(p.logo_url)
      setAgents(a)
      setLoadingProfile(false)
    })
  }, [email])

  function showSuccess(msg: string) {
    setErrorMsg(null)
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  function showError(msg: string) {
    setSuccessMsg(null)
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(null), 6000)
  }

  /* ── Identité visuelle ── */
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSaveIdentite() {
    if (!email) return
    setSavingIdentite(true)

    let logo_url = profile.logo_url
    if (logoFile) {
      setUploadingLogo(true)
      const uploadedUrl = await uploadLogo(logoFile, email)
      setUploadingLogo(false)
      if (!uploadedUrl) {
        setSavingIdentite(false)
        showError('Erreur lors du téléversement du logo. Vérifiez le bucket Supabase.')
        return
      }
      logo_url = uploadedUrl
      setLogoFile(null)
    }

    const updated: UserProfile = { ...profile as UserProfile, email, logo_url }
    const { error } = await upsertUserProfile(updated)
    if (error) showError(`Erreur : ${error}`)
    else { setProfile(updated); showSuccess('Identité visuelle enregistrée avec succès.') }
    setSavingIdentite(false)
  }

  /* ── Informations ── */
  async function handleSaveInfos() {
    if (!email) return
    setSavingInfos(true)
    const toSave: UserProfile = {
      ...(profile as UserProfile),
      email,
      prenom:         profile.prenom         ?? '',
      nom_entreprise: profile.nom_entreprise ?? '',
      secteur:        profile.secteur        ?? '',
      pays:           profile.pays           ?? '',
      adresse:        profile.adresse        ?? '',
      telephone:      profile.telephone      ?? '',
      email_contact:  profile.email_contact  ?? '',
      site_web:       profile.site_web       ?? '',
      rccm:           profile.rccm           ?? '',
      contribuable:   profile.contribuable   ?? '',
      services:       profile.services       ?? '',
      zones:          profile.zones          ?? '',
      nombre_biens:   profile.nombre_biens   ?? '',
    }
    const { error } = await upsertUserProfile(toSave)
    if (error) showError(`Erreur lors de la sauvegarde : ${error}`)
    else { setProfile(toSave); showSuccess('Informations de l\'entreprise enregistrées.') }
    setSavingInfos(false)
  }

  /* ── Agents ── */
  async function handleAddAgent() {
    if (!email || !newAgentNom.trim()) return
    setAddingAgent(true)
    const { error } = await addAgent({ user_email: email, nom: newAgentNom.trim(), role: newAgentRole.trim() || undefined })
    if (error) {
      showError(`Erreur lors de l'ajout : ${error}`)
    } else {
      const updated = await getAgents(email)
      setAgents(updated)
      setNewAgentNom('')
      setNewAgentRole('')
      showSuccess('Agent ajouté avec succès.')
    }
    setAddingAgent(false)
  }

  async function handleDeleteAgent(id: string) {
    await deleteAgent(id)
    setAgents((prev) => prev.filter((a) => a.id !== id))
    showSuccess('Agent supprimé.')
  }

  /* ── Rapports ── */
  async function handleSaveRapport() {
    if (!email) return
    setSavingRapport(true)
    const toSave: UserProfile = {
      ...(profile as UserProfile),
      email,
      rapport_frequence: profile.rapport_frequence ?? 'Désactivé',
      rapport_email:     profile.rapport_email     ?? '',
    }
    const { error } = await upsertUserProfile(toSave)
    if (error) showError(`Erreur lors de la sauvegarde : ${error}`)
    else { setProfile(toSave); showSuccess('Paramètres de rapport enregistrés.') }
    setSavingRapport(false)
  }

  if (status === 'loading' || loadingProfile) {
    return (
      <div className="min-h-screen bg-[#0a1a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a1a0f] relative">

      {/* Background decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#22c55e]/[0.06] rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-[400px] h-[400px] bg-[#22c55e]/[0.04] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-[400px] h-[400px] bg-[#166534]/[0.05] rounded-full blur-3xl" />
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-[#f0fdf4] text-xl font-bold">Param&egrave;tres</h1>
          <p className="text-[#4ade80]/50 text-xs mt-0.5">Gestion des int&eacute;grations et pr&eacute;f&eacute;rences</p>
        </div>

        {successMsg && <SuccessBanner msg={successMsg} onClose={() => setSuccessMsg(null)} />}
        {errorMsg && <ErrorBanner msg={errorMsg} onClose={() => setErrorMsg(null)} />}

        {/* ── 1. Identité visuelle ── */}
        <SectionCard id="identite" title="Identité visuelle" icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        }>
          <div className="flex items-start gap-6 mb-5">
            {/* Aperçu logo */}
            <div className="shrink-0">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/15 hover:border-[#22c55e]/50 bg-white/[0.03] flex items-center justify-center cursor-pointer transition-all overflow-hidden group"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="text-center p-2">
                    <svg className="w-7 h-7 text-[#22c55e]/40 mx-auto mb-1 group-hover:text-[#22c55e]/70 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p className="text-[#86efac]/30 text-[9px] leading-tight">Cliquer pour<br/>uploader</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <p className="text-[#86efac]/30 text-[10px] text-center mt-1">JPG, PNG, SVG</p>
            </div>

            {/* Nom entreprise */}
            <div className="flex-1">
              <FieldLabel>Nom de l&apos;entreprise</FieldLabel>
              <TextInput
                value={profile.nom_entreprise ?? ''}
                onChange={(v) => setProfile((p) => ({ ...p, nom_entreprise: v }))}
                placeholder="Ex : Agence Nexflow"
              />
              <p className="text-[#86efac]/30 text-xs mt-2">Ce nom appara&icirc;tra dans tous les PDF g&eacute;n&eacute;r&eacute;s.</p>
            </div>
          </div>

          <SaveButton onClick={handleSaveIdentite} loading={savingIdentite || uploadingLogo} label={uploadingLogo ? 'Upload en cours...' : 'Enregistrer'} />
        </SectionCard>

        {/* ── 2. Informations entreprise ── */}
        <SectionCard id="infos" title="Informations de l'entreprise" icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
        }>
          <div className="space-y-4 mb-5">
            {/* Profil Directeur */}
            <p className="text-[#86efac]/50 text-[10px] font-semibold tracking-widest uppercase">Profil Directeur</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Prénom</FieldLabel>
                <TextInput value={profile.prenom ?? ''} onChange={(v) => setProfile((p) => ({ ...p, prenom: v }))} placeholder="Ex : Kouadio" />
              </div>
              <div>
                <FieldLabel>Nom</FieldLabel>
                <TextInput value={profile.nom ?? ''} onChange={(v) => setProfile((p) => ({ ...p, nom: v }))} placeholder="Ex : Koffi" />
              </div>
            </div>

            {/* Agence */}
            <p className="text-[#86efac]/50 text-[10px] font-semibold tracking-widest uppercase pt-2">Agence</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FieldLabel>Adresse</FieldLabel>
                <TextInput value={profile.adresse ?? ''} onChange={(v) => setProfile((p) => ({ ...p, adresse: v }))} placeholder="Ex : Cocody Riviera 2, Abidjan" />
              </div>
              <div>
                <FieldLabel>Téléphone</FieldLabel>
                <TextInput value={profile.telephone ?? ''} onChange={(v) => setProfile((p) => ({ ...p, telephone: v }))} placeholder="+225 07 00 00 00 00" />
              </div>
              <div>
                <FieldLabel>Email de contact</FieldLabel>
                <TextInput value={profile.email_contact ?? ''} onChange={(v) => setProfile((p) => ({ ...p, email_contact: v }))} placeholder="contact@agence.ci" />
              </div>
              <div>
                <FieldLabel>Site web</FieldLabel>
                <TextInput value={profile.site_web ?? ''} onChange={(v) => setProfile((p) => ({ ...p, site_web: v }))} placeholder="https://www.agence.ci" />
              </div>
              <div>
                <FieldLabel>Pays</FieldLabel>
                <TextInput value={profile.pays ?? ''} onChange={(v) => setProfile((p) => ({ ...p, pays: v }))} placeholder="Ex : Côte d'Ivoire" />
              </div>
              <div>
                <FieldLabel>RCCM</FieldLabel>
                <TextInput value={profile.rccm ?? ''} onChange={(v) => setProfile((p) => ({ ...p, rccm: v }))} placeholder="CI-ABJ-2024-B-0000" />
              </div>
              <div>
                <FieldLabel>N° Contribuable</FieldLabel>
                <TextInput value={profile.contribuable ?? ''} onChange={(v) => setProfile((p) => ({ ...p, contribuable: v }))} placeholder="000000000" />
              </div>
            </div>

            {/* Services & Zones */}
            <p className="text-[#86efac]/50 text-[10px] font-semibold tracking-widest uppercase pt-2">Services & Zones</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Services proposés</FieldLabel>
                <TextInput value={profile.services ?? ''} onChange={(v) => setProfile((p) => ({ ...p, services: v }))} placeholder="location,vente,gestion" />
                <p className="text-white/25 text-[10px] mt-1">Séparés par des virgules</p>
              </div>
              <div>
                <FieldLabel>Zones d&apos;intervention</FieldLabel>
                <TextInput value={profile.zones ?? ''} onChange={(v) => setProfile((p) => ({ ...p, zones: v }))} placeholder="Cocody,Plateau,Marcory" />
                <p className="text-white/25 text-[10px] mt-1">Séparées par des virgules</p>
              </div>
              <div>
                <FieldLabel>Biens en portefeuille</FieldLabel>
                <TextInput value={profile.nombre_biens ?? ''} onChange={(v) => setProfile((p) => ({ ...p, nombre_biens: v }))} placeholder="Ex : 20 – 50" />
              </div>
            </div>
          </div>
          <SaveButton onClick={handleSaveInfos} loading={savingInfos} />
        </SectionCard>

        {/* ── 3. Agents ── */}
        <SectionCard id="agents" title="Gestion des agents" icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        }>
          {/* Liste agents */}
          {agents.length === 0 ? (
            <p className="text-[#86efac]/30 text-sm text-center py-4">Aucun agent ajout&eacute; pour le moment.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {agents.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-[#f0fdf4] text-sm font-medium">{a.nom}</p>
                    {a.role && <p className="text-[#86efac]/50 text-xs">{a.role}</p>}
                  </div>
                  <button
                    onClick={() => a.id && handleDeleteAgent(a.id)}
                    className="text-red-400/50 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-950/30"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Ajout agent */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-[#86efac]/60 text-xs font-semibold tracking-widest uppercase mb-3">Ajouter un agent</p>
            <div className="flex gap-2 mb-2">
              <input
                value={newAgentNom}
                onChange={(e) => setNewAgentNom(e.target.value)}
                placeholder="Nom de l'agent"
                className="flex-1 bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
              />
              <input
                value={newAgentRole}
                onChange={(e) => setNewAgentRole(e.target.value)}
                placeholder="Rôle (optionnel)"
                className="flex-1 bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
              />
            </div>
            <button
              onClick={handleAddAgent}
              disabled={!newAgentNom.trim() || addingAgent}
              className="flex items-center gap-2 border border-[#22c55e]/40 hover:border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/5 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm py-2.5 px-5 rounded-xl transition-all duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {addingAgent ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </SectionCard>

        {/* ── 4. Stockage ── */}
        <SectionCard id="stockage" title="Stockage" icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/></svg>
        }>
          {/* Nexflow Cloud — toujours actif */}
          <div className="mb-4 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#166534]/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-[#22c55e]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
                  </svg>
                </div>
                <div>
                  <p className="text-[#f0fdf4] text-sm font-semibold">Nexflow Cloud</p>
                  <p className="text-[#86efac]/40 text-xs">Stockage sécurisé par défaut</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[#22c55e] text-xs font-semibold">Actif par défaut</span>
              </div>
            </div>
            <p className="text-[#86efac]/30 text-xs mt-2.5 pl-11">
              Vos fiches sont automatiquement sauvegardées dans la base de données Nexflow (Supabase). Ce stockage est inclus et ne peut pas être désactivé.
            </p>
          </div>

          {/* Google Drive */}
          <div className="mb-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <svg viewBox="0 0 87.3 78" className="w-5 h-5 shrink-0"><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28.1 52H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.35 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 47.5C.4 48.9 0 50.45 0 52h28.1z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.2l5.9 11.75z" fill="#ea4335"/><path d="M43.65 25L57.95 0H29.35z" fill="#00832d"/><path d="M59.2 52h28.1L73.55 28.5 57.95 0 43.65 25z" fill="#2684fc"/><path d="M28.1 52l-14.3 24.8c1.35.8 2.9 1.2 4.5 1.2h50.7c1.6 0 3.15-.45 4.5-1.2L59.2 52z" fill="#ffba00"/></svg>
              <div>
                <p className="text-[#f0fdf4] text-sm font-semibold">Google Drive</p>
                <p className="text-[#86efac]/40 text-xs">Dossier : &ldquo;Nexflow - Fiches Qualification&rdquo;</p>
              </div>
            </div>
            {session?.access_token ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-[#166534]/20 border border-[#22c55e]/20 rounded-xl px-3 py-2 text-xs">
                  {session.user?.image && <img src={session.user.image} alt="" className="w-5 h-5 rounded-full"/>}
                  <span className="text-[#86efac]">{session.user?.email}</span>
                  <span className="flex items-center gap-1 text-[#22c55e]"><span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"/>Connect&eacute;</span>
                </div>
                <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-red-400/60 hover:text-red-400 text-xs border border-red-800/30 hover:border-red-600/50 rounded-lg px-3 py-2 transition-all">
                  D&eacute;connecter
                </button>
              </div>
            ) : (
              <button onClick={() => signIn('google', { callbackUrl: '/parametres' })} className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm py-2.5 px-5 rounded-xl transition-all hover:scale-[1.02] shadow-md shadow-black/20">
                <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Connecter Google Drive
              </button>
            )}
          </div>

          {/* OneDrive */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 96 96" className="w-5 h-5 shrink-0"><defs><linearGradient id="od2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0364b8"/><stop offset="100%" stopColor="#0078d4"/></linearGradient></defs><path d="M57.9 26.2A22.06 22.06 0 0 0 37.1 14a22.07 22.07 0 0 0-20.6 14.2A18 18 0 0 0 18 64h38.6l1.2-.7A18 18 0 0 0 57.9 26.2z" fill="#0364b8"/><path d="M62.9 32.2a18 18 0 0 0-2.7.2 22.1 22.1 0 0 1 4.5 14.7A18 18 0 0 1 54 63.4l-.6.6H78a18 18 0 0 0 0-36 17.93 17.93 0 0 0-15.1 4.2z" fill="url(#od2)"/></svg>
              <div>
                <p className="text-[#f0fdf4] text-sm font-semibold">OneDrive</p>
                <p className="text-[#86efac]/30 text-xs">Int&eacute;gration Microsoft</p>
              </div>
            </div>
            <span className="text-xs bg-white/5 text-white/30 border border-white/10 px-2.5 py-1 rounded-full">Bientôt disponible</span>
          </div>
        </SectionCard>

        {/* ── 5. Rapports ── */}
        <SectionCard id="rapports" title="Rapports automatiques" icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        }>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <FieldLabel>Fr&eacute;quence</FieldLabel>
              <select
                value={profile.rapport_frequence ?? 'Désactivé'}
                onChange={(e) => setProfile((p) => ({ ...p, rapport_frequence: e.target.value }))}
                className="w-full bg-white/5 border border-white/[0.15] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all appearance-none"
              >
                {['Désactivé', 'Quotidien', 'Hebdomadaire'].map((o) => (
                  <option key={o} value={o} className="bg-[#0f2318]">{o}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Email de r&eacute;ception</FieldLabel>
              <TextInput
                value={profile.rapport_email ?? ''}
                onChange={(v) => setProfile((p) => ({ ...p, rapport_email: v }))}
                placeholder="rapport@entreprise.com"
              />
            </div>
          </div>
          <SaveButton onClick={handleSaveRapport} loading={savingRapport} />
        </SectionCard>

        {/* ── 6. Compte ── */}
        <SectionCard id="compte" title="Compte" icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        }>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 flex-1 min-w-0">
              {session?.user?.image && (
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full shrink-0"/>
              )}
              <div className="min-w-0">
                <p className="text-[#86efac]/50 text-[10px] tracking-widest uppercase">Compte connect&eacute;</p>
                <p className="text-[#f0fdf4] text-sm truncate">{email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 border border-red-800/40 hover:border-red-600/60 text-red-400 hover:text-red-300 text-sm font-medium py-3 px-5 rounded-xl transition-all shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Se d&eacute;connecter
            </button>
          </div>
        </SectionCard>

        <p className="text-center text-[#15803d] text-xs tracking-widest pb-4">
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </main>
    </div>
  )
}
