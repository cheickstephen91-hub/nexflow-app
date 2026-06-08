'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { upsertUserProfile, getUserProfile } from '@/lib/user-profile'
import { NexflowLogo } from '@/components/nexflow-logo'

/* ── Données ── */

const PAYS_AFRIQUE = [
  'Guinée', 'Sénégal', "Côte d'Ivoire", 'Mali', 'Burkina Faso', 'Niger',
  'Bénin', 'Togo', 'Cameroun', 'Congo', 'RDC', 'Gabon', 'Madagascar',
  'Angola', 'Mozambique', 'Namibie', 'Zimbabwe', 'Zambie', 'Malawi',
  'Tanzanie', 'Kenya', 'Ouganda', 'Rwanda', 'Éthiopie', 'Ghana', 'Nigeria',
  'Mauritanie', 'Maroc', 'Algérie', 'Tunisie', 'Égypte', 'Afrique du Sud',
]

const AUTRES_PAYS = [
  'France', 'Belgique', 'Suisse', 'Canada', 'États-Unis', 'Royaume-Uni',
  'Allemagne', 'Espagne', 'Italie', 'Portugal', 'Pays-Bas', 'Luxembourg',
  'Autre',
]

const SECTEURS = [
  { id: 'immobilier',    label: 'Immobilier',       icon: '🏠', disponible: true  },
  { id: 'juridique',    label: 'Juridique',         icon: '⚖️', disponible: false },
  { id: 'sante',        label: 'Santé',             icon: '🏥', disponible: false },
  { id: 'assurance',    label: 'Assurance',         icon: '🛡️', disponible: false },
  { id: 'callcenter',   label: "Centre d'appels",   icon: '📞', disponible: false },
  { id: 'auto',         label: 'Concessionnaire',   icon: '🚗', disponible: false },
  { id: 'commerce',     label: 'Commerce',          icon: '🛒', disponible: false },
  { id: 'hotellerie',   label: 'Hôtellerie',        icon: '🏨', disponible: false },
  { id: 'education',    label: 'Éducation',         icon: '🎓', disponible: false },
]

const NB_EMPLOYES = ['1-5', '6-20', '21-50', '51-200', '200+']

/* ── Composants ── */

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
            ${i < current ? 'bg-[#22c55e] text-[#0a1a0f]' :
              i === current ? 'bg-[#22c55e]/20 border-2 border-[#22c55e] text-[#22c55e]' :
              'bg-white/[0.08] text-white/20'}`}
          >
            {i < current ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            ) : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`h-0.5 w-8 transition-all ${i < current ? 'bg-[#22c55e]' : 'bg-white/15'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Page ── */

export default function Onboarding() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Champs du formulaire
  const [pays, setPays] = useState('')
  const [typeCompte, setTypeCompte] = useState<'entreprise' | 'particulier' | ''>('')
  const [nomEntreprise, setNomEntreprise] = useState('')
  const [nbEmployes, setNbEmployes] = useState('')
  const [secteur, setSecteur] = useState('')

  useEffect(() => {
    if (status !== 'authenticated') return
    // Si onboarding déjà fait, rediriger
    getUserProfile(session!.user!.email!).then((p) => {
      if (p?.onboarding_complete) router.replace('/')
    })
  }, [status, session, router])

  const STEPS = ['Localisation', 'Votre profil', 'Secteur d\'activité']

  async function handleFinish() {
    if (!session?.user?.email) return
    setSaving(true)
    setError(null)

    const { error: err } = await upsertUserProfile({
      email: session.user.email,
      nom: session.user.name ?? '',
      pays,
      type_compte: typeCompte,
      nom_entreprise: typeCompte === 'entreprise' ? nomEntreprise : '',
      nombre_employes: typeCompte === 'entreprise' ? nbEmployes : '',
      secteur,
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

  return (
    <main className="min-h-screen bg-[#0a1a0f] relative flex flex-col items-center justify-center px-4 py-10">

      {/* Background decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#22c55e]/[0.07] rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[#22c55e]/[0.05] rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#166534]/[0.06] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <NexflowLogo size="lg" />
        </div>

        {/* Card glassmorphism */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <StepIndicator current={step} total={3} />

          {/* ── ÉTAPE 0 : Pays ── */}
          {step === 0 && (
            <div>
              <h2 className="text-[#f0fdf4] text-lg font-bold mb-1">Où êtes-vous basé ?</h2>
              <p className="text-[#86efac]/50 text-xs mb-6">Sélectionnez votre pays d&apos;activité principale</p>

              <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">Pays</label>
              <select
                value={pays}
                onChange={(e) => setPays(e.target.value)}
                className="w-full bg-white/5 border border-white/[0.15] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
              >
                <option value="" disabled>Sélectionner votre pays...</option>
                <optgroup label="── Afrique ──">
                  {PAYS_AFRIQUE.map((p) => <option key={p} value={p}>{p}</option>)}
                </optgroup>
                <optgroup label="── Reste du monde ──">
                  {AUTRES_PAYS.map((p) => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              </select>

              <button
                onClick={() => setStep(1)}
                disabled={!pays}
                className="mt-6 w-full bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-3.5 rounded-xl transition-all duration-200"
              >
                Continuer &rarr;
              </button>
            </div>
          )}

          {/* ── ÉTAPE 1 : Type de compte ── */}
          {step === 1 && (
            <div>
              <h2 className="text-[#f0fdf4] text-lg font-bold mb-1">Votre profil</h2>
              <p className="text-[#86efac]/50 text-xs mb-6">Dites-nous en plus sur vous</p>

              {/* Type */}
              <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-3">Type de compte</label>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {(['entreprise', 'particulier'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeCompte(t)}
                    className={`py-4 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-150 capitalize
                      ${typeCompte === t
                        ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                        : 'border-white/10 bg-white/5 text-white/50 hover:border-[#22c55e]/40 hover:bg-white/10'
                      }`}
                  >
                    {t === 'entreprise' ? '🏢 Entreprise' : '👤 Particulier'}
                  </button>
                ))}
              </div>

              {/* Détails entreprise */}
              {typeCompte === 'entreprise' && (
                <div className="space-y-4 mt-2">
                  <div>
                    <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">Nom de l&apos;entreprise</label>
                    <input
                      value={nomEntreprise}
                      onChange={(e) => setNomEntreprise(e.target.value)}
                      placeholder="Ex : Agence W Immobilier"
                      className="w-full bg-white/5 border border-white/[0.15] text-white placeholder-white/25 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e]/70 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-widest text-[#86efac] uppercase mb-1.5">Nombre d&apos;employés</label>
                    <div className="flex flex-wrap gap-2">
                      {NB_EMPLOYES.map((n) => (
                        <button
                          key={n}
                          onClick={() => setNbEmployes(n)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                            ${nbEmployes === n
                              ? 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'
                              : 'border-white/10 text-white/40 hover:border-[#22c55e]/40'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 hover:border-white/20 hover:text-white transition-all">
                  &larr; Retour
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!typeCompte || (typeCompte === 'entreprise' && !nomEntreprise)}
                  className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-3 rounded-xl transition-all"
                >
                  Continuer &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Secteur ── */}
          {step === 2 && (
            <div>
              <h2 className="text-[#f0fdf4] text-lg font-bold mb-1">Secteur d&apos;activité</h2>
              <p className="text-[#86efac]/50 text-xs mb-5">Choisissez votre domaine pour personnaliser l&apos;application</p>

              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {SECTEURS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => s.disponible && setSecteur(s.id)}
                    disabled={!s.disponible}
                    className={`relative flex flex-col items-center justify-center gap-1.5 py-4 px-2 rounded-xl border-2 text-center transition-all duration-150
                      ${!s.disponible
                        ? 'border-white/[0.08] bg-white/[0.02] opacity-40 cursor-not-allowed'
                        : secteur === s.id
                          ? 'border-[#22c55e] bg-[#22c55e]/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-[#22c55e]/40 hover:bg-white/5 cursor-pointer'
                      }`}
                  >
                    <span className="text-xl leading-none">{s.icon}</span>
                    <span className={`text-xs font-semibold leading-tight ${secteur === s.id ? 'text-[#22c55e]' : 'text-[#86efac]/70'}`}>
                      {s.label}
                    </span>
                    {!s.disponible && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white/10 text-white/40 text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium border border-white/10">
                        Bientôt
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-xs mb-3 text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:bg-white/10 hover:border-white/20 hover:text-white transition-all">
                  &larr; Retour
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!secteur || saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:bg-[#166534] disabled:cursor-not-allowed text-[#0a1a0f] disabled:text-[#0a1a0f]/40 font-semibold text-sm py-3 rounded-xl transition-all"
                >
                  {saving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                      </svg>
                      Enregistrement&hellip;
                    </>
                  ) : (
                    'Commencer &rarr;'
                  )}
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
