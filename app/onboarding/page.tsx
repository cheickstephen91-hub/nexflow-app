'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession }                   from 'next-auth/react'
import { useRouter }                    from 'next/navigation'
import { upsertUserProfile, getUserProfile, uploadLogo } from '@/lib/user-profile'
import { NexflowLogo } from '@/components/ui/nexflow'

/* ── Données ─────────────────────────────────────────────────────────────── */

const COMMUNES_GRAND_ABIDJAN = [
  'Cocody', 'Plateau', 'Marcory', 'Treichville', 'Adjamé', 'Attécoubé',
  'Yopougon', 'Abobo', 'Anyama', 'Bingerville', 'Songon', 'Jacqueville',
  'Port-Bouët', 'Koumassi', 'Vridi', 'Grand-Bassam', 'Dabou',
  'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Aboisso',
]

const SERVICES_OPTIONS = [
  { id: 'location',  label: 'Location',        icon: '🔑' },
  { id: 'vente',     label: 'Vente',            icon: '🏷️' },
  { id: 'gestion',   label: 'Gestion locative', icon: '📋' },
  { id: 'promotion', label: 'Promotion immo.',  icon: '🏗️' },
]

const NB_BIENS = ['< 20', '20 – 50', '50 – 100', '100 – 300', '300+']

const ROLE_DETAILS = {
  directeur: {
    title: 'Directeur',
    description: 'Accès complet à l’espace entreprise et aux réglages sensibles.',
    permissions: ['Gestion de l’équipe', 'Paramètres entreprise', 'Rapports complets'],
  },
  manager: {
    title: 'Manager',
    description: 'Supervision opérationnelle sans accès aux paramètres sensibles.',
    permissions: ['Suivi des fiches', 'Pilotage des agents', 'Rapports opérationnels'],
  },
}

/* ── Composants UI ───────────────────────────────────────────────────────── */

function Stepper({ step, total }: { step: number; total: number }) {
  const labels = ['Entreprise', 'Services', 'Profil admin']
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center" style={{ flex: i < total - 1 ? 1 : 'none' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300"
              style={
                i < step
                  ? { background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', boxShadow: '0 8px 20px rgba(37,99,235,0.30)', transform: 'scale(1)' }
                  : i === step
                  ? { background: '#fff', border: '2.5px solid #2563eb', color: '#2563eb', boxShadow: '0 0 0 4px rgba(37,99,235,0.12)', transform: 'scale(1.10)' }
                  : { background: '#f8fafc', border: '1px solid #e5e7eb', color: '#cbd5e1', transform: 'scale(1)' }
              }
            >
              {i < step ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : i + 1}
            </div>
            {i < total - 1 && (
              <div className="flex-1 mx-3 h-[3px] rounded-full overflow-hidden" style={{ background: '#e5e7eb' }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: i < step ? '100%' : '0%', background: '#2563eb' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 text-center">
        {labels.map((label, i) => (
          <p
            key={i}
            className="text-[10px] font-bold tracking-wider transition-colors"
            style={{ color: i === step ? '#2563eb' : i < step ? '#93c5fd' : '#94a3b8' }}
          >
            {label.toUpperCase()}
          </p>
        ))}
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#374151' }}>
      {children}
    </label>
  )
}

function TextInput({
  value, onChange, placeholder, type = 'text', icon,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: React.ReactNode
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#2563eb' }}>
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl py-3.5 text-sm transition-all focus:outline-none"
        style={{
          background:    '#fff',
          border:        '1px solid #e5e7eb',
          color:         '#1e293b',
          paddingLeft:   icon ? '2.75rem' : '1rem',
          paddingRight:  '1rem',
          boxShadow:     '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onFocus={(e)  => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
        onBlur={(e)   => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}
      />
    </div>
  )
}

function BtnPrimary({
  onClick, disabled, children, className = '',
}: {
  onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full font-bold text-sm transition-all duration-200 ${className}`}
      style={{
        background:  disabled ? '#bfdbfe' : '#2563eb',
        color:       disabled ? 'rgba(255,255,255,0.7)' : '#fff',
        boxShadow:   disabled ? 'none' : '0 8px 24px rgba(37,99,235,0.24)',
        cursor:      disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8' }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#2563eb' }}
    >
      {children}
    </button>
  )
}

function BtnSecondary({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full text-sm font-bold transition-all"
      style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#64748b', padding: '0.875rem 1.5rem' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLButtonElement).style.color = '#2563eb' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
    >
      {children}
    </button>
  )
}

/* ── Zone multi-select combobox ────────────────────────────────────────────
   Trigger (looks like an input) → opens dropdown with search + checkbox list.
   Selected communes show as removable badges below the field.
──────────────────────────────────────────────────────────────────────────── */
function ZoneCombobox({
  zones, toggleZone, zoneQuery, setZoneQuery, zonesOpen, setZonesOpen, filteredZones,
}: {
  zones: string[]; toggleZone: (z: string) => void
  zoneQuery: string; setZoneQuery: (v: string) => void
  zonesOpen: boolean; setZonesOpen: (v: boolean) => void
  filteredZones: string[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setZonesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [setZonesOpen])

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setZonesOpen(!zonesOpen); setZoneQuery('') }}
        className="w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-sm text-left transition-all"
        style={{
          background:  '#fff',
          border:      `1px solid ${zonesOpen ? '#2563eb' : '#e5e7eb'}`,
          color:       zones.length > 0 ? '#1e293b' : '#94a3b8',
          boxShadow:   zonesOpen ? '0 0 0 3px rgba(37,99,235,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <span className="font-medium">
          {zones.length > 0 ? `${zones.length} commune${zones.length > 1 ? 's' : ''} sélectionnée${zones.length > 1 ? 's' : ''}` : 'Sélectionner des communes...'}
        </span>
        <svg
          className="h-4 w-4 shrink-0 transition-transform"
          style={{ color: '#2563eb', transform: zonesOpen ? 'rotate(180deg)' : 'none' }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown */}
      {zonesOpen && (
        <div
          className="absolute z-20 mt-1 w-full rounded-xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}
        >
          {/* Search */}
          <div className="p-2 border-b" style={{ borderColor: '#f1f5f9' }}>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94a3b8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                autoFocus
                value={zoneQuery}
                onChange={(e) => setZoneQuery(e.target.value)}
                placeholder="Rechercher une commune..."
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none"
                style={{ background: '#f8fafc', border: '1px solid #e5e7eb', color: '#1e293b' }}
              />
            </div>
          </div>
          {/* List */}
          <div className="max-h-52 overflow-y-auto p-1">
            {filteredZones.length > 0 ? filteredZones.map((z) => {
              const selected = zones.includes(z)
              return (
                <button
                  key={z}
                  type="button"
                  onClick={() => toggleZone(z)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all"
                  style={{ color: selected ? '#2563eb' : '#374151', background: selected ? '#eff6ff' : 'transparent' }}
                  onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc' }}
                  onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                    style={{
                      border:     `${selected ? 2 : 1}px solid ${selected ? '#2563eb' : '#d1d5db'}`,
                      background: selected ? '#2563eb' : '#fff',
                      color:      '#fff',
                    }}
                  >
                    {selected && (
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </span>
                  {z}
                </button>
              )
            }) : (
              <p className="py-6 text-center text-sm" style={{ color: '#94a3b8' }}>Aucune commune trouvée</p>
            )}
          </div>
        </div>
      )}

      {/* Badges */}
      {zones.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {zones.map((z) => (
            <span
              key={z}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}
            >
              {z}
              <button
                type="button"
                onClick={() => toggleZone(z)}
                className="leading-none transition-opacity hover:opacity-70"
                aria-label={`Retirer ${z}`}
                style={{ color: '#2563eb' }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function Onboarding() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [step,   setStep]   = useState(0)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  /* Étape 1 — Entreprise */
  const [nomEntreprise, setNomEntreprise] = useState('')
  const [adresse,       setAdresse]       = useState('')
  const [telephone,     setTelephone]     = useState('')
  const [emailContact,  setEmailContact]  = useState('')
  const [siteWeb,       setSiteWeb]       = useState('')
  const [rccm,          setRccm]          = useState('')
  const [contribuable,  setContribuable]  = useState('')
  const [logoFile,      setLogoFile]      = useState<File | null>(null)
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* Étape 2 — Services */
  const [services,    setServices]    = useState<string[]>([])
  const [zones,       setZones]       = useState<string[]>([])
  const [nombreBiens, setNombreBiens] = useState('')
  const [zonesOpen,   setZonesOpen]   = useState(false)
  const [zoneQuery,   setZoneQuery]   = useState('')

  /* Étape 3 — Profil admin */
  const [prenom,       setPrenom]       = useState('')
  const [nom,          setNom]          = useState('')
  const [adminRole,    setAdminRole]    = useState<'directeur' | 'manager'>('directeur')
  const [photoFile,    setPhotoFile]    = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    getUserProfile(session!.user!.email!).then((p) => {
      if (p?.onboarding_complete) router.replace('/')
    })
  }, [status, session, router])

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function toggleService(id: string) {
    setServices((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  function toggleZone(z: string) {
    setZones((prev) => prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z])
  }

  async function handleFinish() {
    if (!session?.user?.email) return
    setSaving(true)
    setError(null)

    const email = session.user.email

    let logo_url: string | undefined = undefined
    if (logoFile) {
      logo_url = (await uploadLogo(logoFile, email)) ?? undefined
    }

    const { error: err } = await upsertUserProfile({
      email,
      nom:             nom || session.user.name || '',
      prenom,
      nom_entreprise:  nomEntreprise,
      adresse,
      telephone,
      email_contact:   emailContact,
      site_web:        siteWeb,
      rccm,
      contribuable,
      services:        services.join(','),
      zones:           zones.join(','),
      nombre_biens:    nombreBiens,
      secteur:         'immobilier',
      role:            adminRole,
      ...(logo_url ? { logo_url } : {}),
      onboarding_complete: true,
    })

    setSaving(false)
    if (err) { setError(err); return }
    router.replace('/')
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#eef2ff' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }} />
      </main>
    )
  }

  const step1Valid     = nomEntreprise.trim().length > 0
  const step2Valid     = services.length > 0
  const step3Valid     = prenom.trim().length > 0 || nom.trim().length > 0
  const filteredZones  = COMMUNES_GRAND_ABIDJAN.filter((z) => z.toLowerCase().includes(zoneQuery.toLowerCase()))
  const currentRole    = ROLE_DETAILS[adminRole]

  /* SVG icons inline */
  const IcoBuilding = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9h1M9 13h1M9 17h1M14 13h1M14 17h1"/></svg>
  const IcoDoc      = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>
  const IcoCoin     = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></svg>
  const IcoPin      = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  const IcoPhone    = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.11 5.18 2 2 0 0 1 5.1 3h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L9 10.68a16 16 0 0 0 4.32 4.32l1.25-1.25a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z"/></svg>
  const IcoMail     = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="m22 6-10 7L2 6"/></svg>
  const IcoGlobe    = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>
  const IcoUser     = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  const IcoUsers    = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-3-3.87M7 21v-2a4 4 0 0 1 3-3.87M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0"/></svg>
  const IcoCheck    = <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>

  return (
    <main
      className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #f8fafc 100%)' }}
    >
      <div className="relative z-10 w-full max-w-4xl">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <NexflowLogo size="lg" context="auth" showTagline />
        </div>

        {/* Carte principale */}
        <div
          className="rounded-3xl p-7 sm:p-10"
          style={{
            background: '#fff',
            border:     '1px solid #e5e7eb',
            boxShadow:  '0 24px 80px rgba(15,23,42,0.10)',
          }}
        >
          <Stepper step={step} total={3} />

          {/* ─── Étape 0 : Entreprise ────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <div className="mb-6">
                <p className="text-xs font-bold tracking-[0.22em] uppercase mb-1" style={{ color: '#2563eb' }}>Étape 1</p>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>Votre entreprise</h2>
                <p className="text-sm" style={{ color: '#64748b' }}>Renseignez les informations officielles de votre agence.</p>
              </div>

              <div className="space-y-5">
                {/* Logo upload */}
                <div>
                  <FieldLabel>Logo de l&apos;agence</FieldLabel>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-all"
                    style={{ borderColor: '#e2e8f0', background: '#fafafa' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLDivElement).style.background = '#f0f9ff' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLDivElement).style.background = '#fafafa' }}
                  >
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
                      style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-8 h-8" style={{ color: '#93c5fd' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                        {logoPreview ? 'Logo prêt à être utilisé' : 'Téléverser le logo de l’agence'}
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>PNG ou JPG, idéalement carré, max 2 MB.</p>
                      <button
                        type="button"
                        className="mt-3 rounded-full text-xs font-bold text-white px-4 py-2 transition-all"
                        style={{ background: '#2563eb', boxShadow: '0 4px 14px rgba(37,99,235,0.22)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2563eb' }}
                      >
                        {logoPreview ? 'Changer le logo' : 'Choisir un fichier'}
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </div>
                </div>

                {/* Nom agence */}
                <div>
                  <FieldLabel>Nom de l&apos;agence <span style={{ color: '#2563eb' }}>*</span></FieldLabel>
                  <TextInput value={nomEntreprise} onChange={setNomEntreprise} placeholder="Ex : Agence Immobilière Abidjan" icon={IcoBuilding} />
                </div>

                {/* RCCM + Contribuable */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>RCCM</FieldLabel>
                    <TextInput value={rccm} onChange={setRccm} placeholder="CI-ABJ-2024-B-0000" icon={IcoDoc} />
                  </div>
                  <div>
                    <FieldLabel>N° Contribuable</FieldLabel>
                    <TextInput value={contribuable} onChange={setContribuable} placeholder="000000000" icon={IcoCoin} />
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <FieldLabel>Adresse</FieldLabel>
                  <TextInput value={adresse} onChange={setAdresse} placeholder="Ex : Cocody Riviera 2, Abidjan" icon={IcoPin} />
                </div>

                {/* Téléphone + Email */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Téléphone</FieldLabel>
                    <TextInput value={telephone} onChange={setTelephone} placeholder="+225 07 00 00 00 00" icon={IcoPhone} />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <TextInput value={emailContact} onChange={setEmailContact} placeholder="contact@agence.ci" type="email" icon={IcoMail} />
                  </div>
                </div>

                {/* Site web */}
                <div>
                  <FieldLabel>Site web</FieldLabel>
                  <TextInput value={siteWeb} onChange={setSiteWeb} placeholder="https://www.agence.ci" icon={IcoGlobe} />
                </div>
              </div>

              <BtnPrimary onClick={() => setStep(1)} disabled={!step1Valid} className="mt-7 w-full py-4">
                Continuer →
              </BtnPrimary>
            </div>
          )}

          {/* ─── Étape 1 : Services ──────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <p className="text-xs font-bold tracking-[0.22em] uppercase mb-1" style={{ color: '#2563eb' }}>Étape 2</p>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>Vos services</h2>
                <p className="text-sm" style={{ color: '#64748b' }}>Définissez votre activité et vos zones d&apos;intervention.</p>
              </div>

              <div className="space-y-6">
                {/* Services */}
                <div>
                  <FieldLabel>Services proposés <span style={{ color: '#2563eb' }}>*</span></FieldLabel>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {SERVICES_OPTIONS.map((s) => {
                      const sel = services.includes(s.id)
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className="flex items-center gap-3 p-4 rounded-2xl border text-sm font-semibold text-left transition-all duration-150"
                          style={{
                            border:     `1px solid ${sel ? '#2563eb' : '#e5e7eb'}`,
                            background: sel ? '#eff6ff' : '#fff',
                            color:      sel ? '#2563eb' : '#475569',
                            boxShadow:  sel ? '0 4px 16px rgba(37,99,235,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
                          }}
                          onMouseEnter={(e) => { if (!sel) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc' }}}
                          onMouseLeave={(e) => { if (!sel) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}}
                        >
                          <span className="text-xl shrink-0">{s.icon}</span>
                          <span className="flex-1 leading-tight">{s.label}</span>
                          {sel && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: '#2563eb' }}>
                              <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Zones — combobox avec dropdown + badges */}
                <div>
                  <FieldLabel>Zones d&apos;intervention</FieldLabel>
                  <ZoneCombobox
                    zones={zones}
                    toggleZone={toggleZone}
                    zoneQuery={zoneQuery}
                    setZoneQuery={setZoneQuery}
                    zonesOpen={zonesOpen}
                    setZonesOpen={setZonesOpen}
                    filteredZones={filteredZones}
                  />
                </div>

                {/* Nombre de biens */}
                <div>
                  <FieldLabel>Nombre de biens en portefeuille</FieldLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {NB_BIENS.map((n) => {
                      const sel = nombreBiens === n
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNombreBiens(n)}
                          className="rounded-2xl border p-3.5 text-center transition-all"
                          style={{
                            border:     `1px solid ${sel ? '#2563eb' : '#e5e7eb'}`,
                            background: sel ? '#eff6ff' : '#fff',
                            color:      sel ? '#2563eb' : '#475569',
                            boxShadow:  sel ? '0 4px 14px rgba(37,99,235,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
                          }}
                          onMouseEnter={(e) => { if (!sel) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc' }}}
                          onMouseLeave={(e) => { if (!sel) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}}
                        >
                          <span className="block text-base font-black leading-tight">{n}</span>
                          <span className="mt-1 block text-[9px] font-bold uppercase tracking-widest" style={{ color: sel ? '#93c5fd' : '#94a3b8' }}>biens</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-7">
                <BtnSecondary onClick={() => setStep(0)}>← Retour</BtnSecondary>
                <BtnPrimary onClick={() => setStep(2)} disabled={!step2Valid} className="flex-1 py-3.5">
                  Continuer →
                </BtnPrimary>
              </div>
            </div>
          )}

          {/* ─── Étape 2 : Profil Admin ──────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <p className="text-xs font-bold tracking-[0.22em] uppercase mb-1" style={{ color: '#2563eb' }}>Étape 3</p>
                <h2 className="text-2xl font-bold mb-1" style={{ color: '#0f172a' }}>Profil admin</h2>
                <p className="text-sm" style={{ color: '#64748b' }}>Finalisez le profil qui pilotera Nexflow au quotidien.</p>
              </div>

              <div className="space-y-5">
                {/* Photo de profil */}
                <div>
                  <FieldLabel>Photo de profil</FieldLabel>
                  <div
                    className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-2xl border p-5"
                    style={{ border: '1px solid #e5e7eb', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                  >
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="w-24 h-24 rounded-full flex items-center justify-center cursor-pointer overflow-hidden shrink-0 transition-all"
                      style={{
                        border:     '2px solid #e5e7eb',
                        background: '#f8fafc',
                        boxShadow:  '0 4px 14px rgba(0,0,0,0.06)',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2563eb' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e7eb' }}
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-10 h-10" style={{ color: '#cbd5e1' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>
                        {photoPreview ? 'Photo sélectionnée' : 'Ajouter une photo professionnelle'}
                      </p>
                      <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Optionnel, recommandé pour identifier le compte admin.</p>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="mt-3 rounded-full text-xs font-bold text-white px-4 py-2 transition-all"
                        style={{ background: '#2563eb', boxShadow: '0 4px 14px rgba(37,99,235,0.22)' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#2563eb' }}
                      >
                        {photoPreview ? 'Changer la photo' : 'Choisir une photo'}
                      </button>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </div>
                </div>

                {/* Prénom + Nom */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Prénom <span style={{ color: '#2563eb' }}>*</span></FieldLabel>
                    <TextInput value={prenom} onChange={setPrenom} placeholder="Ex : Kouadio" icon={IcoUser} />
                  </div>
                  <div>
                    <FieldLabel>Nom</FieldLabel>
                    <TextInput value={nom} onChange={setNom} placeholder="Ex : Koffi" icon={IcoUsers} />
                  </div>
                </div>

                {/* Rôle */}
                <div>
                  <FieldLabel>Votre rôle</FieldLabel>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(['directeur', 'manager'] as const).map((r) => {
                      const sel  = adminRole === r
                      const info = ROLE_DETAILS[r]
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setAdminRole(r)}
                          className="flex flex-col items-start gap-3.5 p-5 rounded-2xl border text-left transition-all duration-150"
                          style={{
                            border:     `${sel ? 2 : 1}px solid ${sel ? '#2563eb' : '#e5e7eb'}`,
                            background: '#fff',
                            boxShadow:  sel ? '0 6px 20px rgba(37,99,235,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
                          }}
                          onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLButtonElement).style.borderColor = '#93c5fd' }}
                          onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb' }}
                        >
                          {/* Icône rôle */}
                          <span
                            className="flex h-11 w-11 items-center justify-center rounded-xl"
                            style={{ background: sel ? '#2563eb' : '#f1f5f9', color: sel ? '#fff' : '#2563eb' }}
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              {r === 'directeur' ? (
                                <><path d="m3 7 5 5 4-8 4 8 5-5-2 12H5L3 7z"/><path d="M5 19h14"/></>
                              ) : (
                                <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>
                              )}
                            </svg>
                          </span>
                          {/* Titre + badge + description */}
                          <span className="w-full">
                            <span className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-black" style={{ color: '#0f172a' }}>{info.title}</span>
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
                                style={
                                  r === 'directeur'
                                    ? { background: '#dbeafe', color: '#2563eb' }
                                    : { background: '#f1f5f9', color: '#64748b' }
                                }
                              >
                                {r === 'directeur' ? 'Accès complet' : 'Accès limité'}
                              </span>
                            </span>
                            <span className="block text-xs leading-relaxed" style={{ color: '#64748b' }}>{info.description}</span>
                          </span>
                          {/* Permissions */}
                          <span className="w-full space-y-1.5">
                            {info.permissions.map((p) => (
                              <span key={p} className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#374151' }}>
                                <span style={{ color: '#2563eb' }}>{IcoCheck}</span>
                                {p}
                              </span>
                            ))}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Récapitulatif — carte blanche */}
                <div
                  className="rounded-2xl border p-5"
                  style={{ background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                >
                  <p className="text-[10px] font-black tracking-[0.22em] uppercase mb-4" style={{ color: '#2563eb' }}>
                    Récapitulatif final
                  </p>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Agence',   value: nomEntreprise || '—' },
                      ...(rccm || contribuable ? [{ label: 'RCCM / Contribuable', value: [rccm, contribuable].filter(Boolean).join(' · ') }] : []),
                      { label: 'Services', value: services.length > 0 ? services.map((s) => SERVICES_OPTIONS.find((o) => o.id === s)?.label).join(', ') : '—' },
                      { label: 'Rôle',     value: currentRole.title },
                      ...(zones.length > 0     ? [{ label: 'Zones',  value: `${zones.length} commune${zones.length > 1 ? 's' : ''}` }] : []),
                      ...(nombreBiens           ? [{ label: 'Biens',  value: nombreBiens }] : []),
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-4 rounded-xl px-4 py-2.5"
                        style={{ background: '#f8fafc' }}
                      >
                        <span className="font-medium shrink-0" style={{ color: '#64748b' }}>{label}</span>
                        <span className="font-bold text-right" style={{ color: '#0f172a' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs mt-4 rounded-xl px-3 py-2.5 text-center" style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }}>
                  {error}
                </p>
              )}

              <div className="flex gap-3 mt-7">
                <BtnSecondary onClick={() => setStep(1)}>← Retour</BtnSecondary>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={!step3Valid || saving}
                  className="flex-1 rounded-full font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 py-4"
                  style={{
                    background:  (!step3Valid || saving) ? '#bfdbfe' : 'linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%)',
                    color:       (!step3Valid || saving) ? 'rgba(255,255,255,0.7)' : '#fff',
                    boxShadow:   (!step3Valid || saving) ? 'none' : '0 8px 30px rgba(37,99,235,0.35), 0 2px 8px rgba(37,99,235,0.20)',
                    cursor:      (!step3Valid || saving) ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={(e) => {
                    if (!(!step3Valid || saving)) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)'
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 36px rgba(37,99,235,0.42), 0 2px 8px rgba(37,99,235,0.25)'
                      ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(!step3Valid || saving)) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg,#3b82f6 0%,#2563eb 60%,#1d4ed8 100%)'
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 30px rgba(37,99,235,0.35), 0 2px 8px rgba(37,99,235,0.20)'
                      ;(e.currentTarget as HTMLButtonElement).style.transform = 'none'
                    }
                  }}
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                      </svg>
                      Enregistrement&hellip;
                    </>
                  ) : (
                    <>
                      🚀 Lancer Nexflow
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs tracking-widest mt-8" style={{ color: '#94a3b8' }}>
          &copy; {new Date().getFullYear()} NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </div>
    </main>
  )
}
