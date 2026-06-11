'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { upsertUserProfile, getUserProfile, uploadLogo } from '@/lib/user-profile'
import { NexflowLogo } from '@/components/nexflow-logo'

/* ── Données ── */

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

/* ── Composants ── */

function ProgressBar({ step, total }: { step: number; total: number }) {
  const labels = ['Entreprise', 'Services', 'Profil admin']
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className="flex items-center" style={{ flex: i < total - 1 ? 1 : 'none' }}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300
              ${i < step  ? 'bg-[#22c55e] text-[#0a1a0f]' :
                i === step ? 'bg-[#22c55e]/15 border-2 border-[#22c55e] text-[#22c55e]' :
                             'bg-white/[0.06] border border-white/15 text-white/25'}`}
            >
              {i < step ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              ) : i + 1}
            </div>
            {i < total - 1 && (
              <div className="flex-1 mx-2 h-0.5 rounded-full overflow-hidden bg-white/10">
                <div className="h-full bg-[#22c55e] transition-all duration-500" style={{ width: i < step ? '100%' : '0%' }} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 text-center">
        {labels.map((label, i) => (
          <p key={i} className={`text-[10px] font-semibold tracking-wider transition-colors
            ${i === step ? 'text-[#22c55e]' : i < step ? 'text-[#4ade80]/60' : 'text-white/20'}`}>
            {label.toUpperCase()}
          </p>
        ))}
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">{children}</label>
}

function TextInput({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
    />
  )
}

/* ── Page ── */

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

  /* Étape 3 — Profil admin */
  const [prenom,       setPrenom]       = useState('')
  const [nom,          setNom]          = useState('')
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
      ...(logo_url ? { logo_url } : {}),
      onboarding_complete: true,
    })

    setSaving(false)
    if (err) { setError(err); return }
    router.replace('/')
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-[#0a1a0f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] border-t-transparent animate-spin" />
      </main>
    )
  }

  const step1Valid = nomEntreprise.trim().length > 0
  const step2Valid = services.length > 0
  const step3Valid = prenom.trim().length > 0 || nom.trim().length > 0

  return (
    <main className="min-h-screen bg-[#0a1a0f] relative flex flex-col items-center justify-center px-4 py-10">

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#22c55e]/[0.07] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[#22c55e]/[0.05] rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#166534]/[0.06] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">

        <div className="flex justify-center mb-8">
          <NexflowLogo size="lg" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <ProgressBar step={step} total={3} />

          {/* ══ ÉTAPE 0 : Entreprise ══ */}
          {step === 0 && (
            <div>
              <h2 className="text-[#f0fdf4] text-lg font-bold mb-1">Votre agence</h2>
              <p className="text-[#86efac]/50 text-xs mb-6">Renseignez les informations de votre entreprise</p>

              <div className="space-y-4">
                <div>
                  <FieldLabel>Logo de l&apos;agence</FieldLabel>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[#22c55e]/50 transition-all overflow-hidden bg-white/5"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21 15 16 10 5 21"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[#22c55e] text-xs font-semibold hover:text-[#4ade80] transition-colors">
                        {logoPreview ? 'Changer le logo' : 'Téléverser un logo'}
                      </button>
                      <p className="text-white/25 text-[10px] mt-0.5">PNG, JPG — max 2 MB</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </div>
                </div>

                <div>
                  <FieldLabel>Nom de l&apos;agence <span className="text-red-400">*</span></FieldLabel>
                  <TextInput value={nomEntreprise} onChange={setNomEntreprise} placeholder="Ex : Agence Immobilière Abidjan" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>RCCM</FieldLabel>
                    <TextInput value={rccm} onChange={setRccm} placeholder="CI-ABJ-2024-B-0000" />
                  </div>
                  <div>
                    <FieldLabel>N° Contribuable</FieldLabel>
                    <TextInput value={contribuable} onChange={setContribuable} placeholder="000000000" />
                  </div>
                </div>

                <div>
                  <FieldLabel>Adresse</FieldLabel>
                  <TextInput value={adresse} onChange={setAdresse} placeholder="Ex : Cocody Riviera 2, Abidjan" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Téléphone</FieldLabel>
                    <TextInput value={telephone} onChange={setTelephone} placeholder="+225 07 00 00 00 00" />
                  </div>
                  <div>
                    <FieldLabel>Email</FieldLabel>
                    <TextInput value={emailContact} onChange={setEmailContact} placeholder="contact@agence.ci" type="email" />
                  </div>
                </div>

                <div>
                  <FieldLabel>Site web</FieldLabel>
                  <TextInput value={siteWeb} onChange={setSiteWeb} placeholder="https://www.agence.ci" />
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!step1Valid}
                className="mt-6 w-full bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-3.5 rounded-xl transition-all duration-200"
              >
                Continuer &rarr;
              </button>
            </div>
          )}

          {/* ══ ÉTAPE 1 : Services ══ */}
          {step === 1 && (
            <div>
              <h2 className="text-[#f0fdf4] text-lg font-bold mb-1">Vos services</h2>
              <p className="text-[#86efac]/50 text-xs mb-6">Sélectionnez les services proposés par votre agence</p>

              <div className="space-y-5">
                <div>
                  <FieldLabel>Services proposés <span className="text-red-400">*</span></FieldLabel>
                  <div className="grid grid-cols-2 gap-2.5">
                    {SERVICES_OPTIONS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`flex items-center gap-2.5 py-3 px-4 rounded-xl border-2 text-sm font-semibold text-left transition-all duration-150
                          ${services.includes(s.id)
                            ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                            : 'border-white/10 bg-white/[0.03] text-white/50 hover:border-[#22c55e]/40 hover:bg-white/5'
                          }`}
                      >
                        <span className="text-lg shrink-0">{s.icon}</span>
                        <span className="text-xs leading-tight">{s.label}</span>
                        {services.includes(s.id) && (
                          <svg className="w-4 h-4 ml-auto shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <FieldLabel>Zones d&apos;intervention</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {COMMUNES_GRAND_ABIDJAN.map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => toggleZone(z)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                          ${zones.includes(z)
                            ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                            : 'border-white/10 text-white/40 hover:border-[#22c55e]/40 hover:text-white/70'
                          }`}
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <FieldLabel>Nombre de biens en portefeuille</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {NB_BIENS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNombreBiens(n)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all
                          ${nombreBiens === n
                            ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                            : 'border-white/10 text-white/40 hover:border-[#22c55e]/40'
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 hover:border-white/20 hover:text-white transition-all">
                  &larr; Retour
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!step2Valid}
                  className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-3 rounded-xl transition-all"
                >
                  Continuer &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ══ ÉTAPE 2 : Profil Admin ══ */}
          {step === 2 && (
            <div>
              <h2 className="text-[#f0fdf4] text-lg font-bold mb-1">Votre profil</h2>
              <p className="text-[#86efac]/50 text-xs mb-6">Complétez les informations du directeur</p>

              <div className="space-y-4">
                <div>
                  <FieldLabel>Photo de profil</FieldLabel>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[#22c55e]/50 transition-all overflow-hidden bg-white/5"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-white/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <button type="button" onClick={() => photoInputRef.current?.click()} className="text-[#22c55e] text-xs font-semibold hover:text-[#4ade80] transition-colors">
                        {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                      </button>
                      <p className="text-white/25 text-[10px] mt-0.5">Optionnel</p>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Prénom <span className="text-red-400">*</span></FieldLabel>
                    <TextInput value={prenom} onChange={setPrenom} placeholder="Ex : Kouadio" />
                  </div>
                  <div>
                    <FieldLabel>Nom</FieldLabel>
                    <TextInput value={nom} onChange={setNom} placeholder="Ex : Koffi" />
                  </div>
                </div>

                {/* Récapitulatif */}
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-2.5">
                  <p className="text-[#86efac]/50 text-[10px] font-semibold tracking-widest uppercase mb-3">Récapitulatif</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 text-xs">Agence</span>
                    <span className="text-white/80 text-xs font-semibold">{nomEntreprise || '—'}</span>
                  </div>
                  {(rccm || contribuable) && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">RCCM / Contribuable</span>
                      <span className="text-white/80 text-xs font-semibold">{[rccm, contribuable].filter(Boolean).join(' · ')}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-white/40 text-xs shrink-0">Services</span>
                    <span className="text-white/80 text-xs font-semibold text-right">
                      {services.length > 0
                        ? services.map((s) => SERVICES_OPTIONS.find((o) => o.id === s)?.label).join(', ')
                        : '—'}
                    </span>
                  </div>
                  {zones.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">Zones</span>
                      <span className="text-white/80 text-xs font-semibold">{zones.length} commune{zones.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {nombreBiens && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">Biens</span>
                      <span className="text-white/80 text-xs font-semibold">{nombreBiens}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs mt-4 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2 text-center">{error}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 hover:border-white/20 hover:text-white transition-all">
                  &larr; Retour
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!step3Valid || saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-3 rounded-xl transition-all"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                      </svg>
                      Enregistrement&hellip;
                    </>
                  ) : 'Lancer Nexflow →'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[#15803d] text-xs tracking-widest mt-8">
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </div>
    </main>
  )
}
