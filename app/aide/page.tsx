'use client'

import { useState } from 'react'
import { NavHeader } from '@/components/nav-header'

const STEPS = [
  { n: 1, label: 'Connectez-vous avec Google', desc: 'Sur la page de connexion, cliquez sur "Se connecter avec Google" et autorisez l\'accès.' },
  { n: 2, label: 'Complétez votre profil entreprise', desc: 'À la première connexion, renseignez votre pays, le type de compte et votre secteur d\'activité.' },
  { n: 3, label: 'Configurez votre stockage', desc: 'Dans Paramètres → Stockage, connectez votre Google Drive pour une sauvegarde automatique des PDF.' },
  { n: 4, label: 'Ajoutez vos agents', desc: 'Dans Paramètres → Gestion des agents, ajoutez les membres de votre équipe. Ils apparaîtront en liste déroulante dans le formulaire.' },
  { n: 5, label: 'Commencez à qualifier vos appels', desc: 'Cliquez sur "Nouvelle fiche" depuis l\'accueil pour remplir votre première fiche de qualification.' },
]

const FAQ: { q: string; r: string }[] = [
  {
    q: 'Comment remplir une fiche de qualification ?',
    r: 'Depuis l\'accueil, cliquez sur "Nouvelle fiche". Remplissez tous les champs disponibles : nom du prospect, téléphone, source du contact, motif, type de bien, budget, localisation, urgence, agent responsable et commentaire. Cliquez sur "Enregistrer la fiche" pour valider.',
  },
  {
    q: 'Où sont stockées mes fiches ?',
    r: 'Vos fiches sont sauvegardées dans une base de données sécurisée. Si vous avez connecté Google Drive ou OneDrive, une copie PDF est automatiquement envoyée dans votre dossier "Nexflow - Fiches Qualification".',
  },
  {
    q: 'Comment connecter mon Google Drive ?',
    r: 'Allez dans Paramètres, section "Stockage", puis cliquez sur "Connecter Google Drive". Connectez-vous avec votre compte Google et autorisez l\'accès.',
  },
  {
    q: 'Comment ajouter des agents ?',
    r: 'Dans Paramètres, section "Gestion des agents", entrez le nom et le rôle de l\'agent puis cliquez sur "Ajouter". L\'agent apparaîtra ensuite dans la liste déroulante du formulaire.',
  },
  {
    q: 'Mon logo apparaît-il sur les PDF ?',
    r: 'Oui. Uploadez votre logo dans Paramètres, section "Identité visuelle". Il sera automatiquement intégré à tous les PDF générés.',
  },
  {
    q: 'Comment lire le tableau de bord ?',
    r: 'Le tableau de bord affiche en temps réel le nombre total de fiches, les fiches du jour et les fiches urgentes. Le tableau liste toutes les fiches avec leurs détails.',
  },
]

export default function Aide() {
  const [openStep, setOpenStep] = useState<number | null>(null)
  const [openFaq,  setOpenFaq]  = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0a1a0f] relative">

      {/* Background decorators */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-[#22c55e]/[0.06] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[#22c55e]/[0.04] rounded-full blur-3xl" />
      </div>

      <NavHeader currentPage="aide" maxWidth="max-w-3xl" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-[#f0fdf4] text-xl font-bold">Aide &amp; Documentation</h1>
          <p className="text-[#4ade80]/50 text-xs mt-0.5">Guides, FAQ et support</p>
        </div>

        {/* ── Guide démarrage ── */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <h2 className="text-[#f0fdf4] font-semibold text-base mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#22c55e]/20 text-[#22c55e] flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
              </svg>
            </span>
            Guide de démarrage rapide
          </h2>
          <ol className="space-y-2">
            {STEPS.map((s) => {
              const isOpen = openStep === s.n
              return (
                <li key={s.n}>
                  <button
                    onClick={() => setOpenStep(isOpen ? null : s.n)}
                    className="w-full flex items-center gap-3 py-3 px-1 text-left group"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#166534]/50 border border-[#22c55e]/30 text-[#22c55e] text-xs font-bold flex items-center justify-center shrink-0">
                      {s.n}
                    </div>
                    <p className="flex-1 text-[#f0fdf4] text-sm font-semibold group-hover:text-[#4ade80] transition-colors">
                      {s.label}
                    </p>
                    <svg
                      className={`w-4 h-4 text-[#22c55e]/60 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isOpen ? '200px' : '0px', opacity: isOpen ? 1 : 0 }}
                  >
                    <p className="text-[#86efac]/55 text-xs leading-relaxed pl-10 pb-3 pr-2">
                      {s.desc}
                    </p>
                  </div>
                  {s.n < STEPS.length && <div className="h-px bg-white/[0.07] ml-10" />}
                </li>
              )
            })}
          </ol>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <h2 className="text-[#f0fdf4] font-semibold text-base mb-4">Questions fréquentes</h2>
          <div className="space-y-0">
            {FAQ.map((item, i) => {
              const isOpen = openFaq === i
              return (
                <div key={i} className={`${i < FAQ.length - 1 ? 'border-b border-white/[0.07]' : ''}`}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-start gap-2 py-4 text-left group"
                  >
                    <span className="text-[#22c55e] text-sm font-bold shrink-0 mt-0.5">Q.</span>
                    <p className="flex-1 text-[#f0fdf4] text-sm font-semibold group-hover:text-[#4ade80] transition-colors">
                      {item.q}
                    </p>
                    <svg
                      className={`w-4 h-4 text-[#22c55e]/60 shrink-0 mt-0.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isOpen ? '300px' : '0px', opacity: isOpen ? 1 : 0 }}
                  >
                    <p className="text-[#86efac]/60 text-xs leading-relaxed pl-5 pb-4">
                      {item.r}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Documentation technique ── */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <h2 className="text-[#f0fdf4] font-semibold text-base mb-5">Documentation technique</h2>
          <div className="space-y-4">
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/10">
              <p className="text-[#f0fdf4] text-sm font-semibold mb-1">Comment exporter les données ?</p>
              <p className="text-[#86efac]/50 text-xs leading-relaxed">Dans le tableau de bord, un bouton &ldquo;Exporter&rdquo; permet de télécharger toutes les fiches en format Excel ou CSV.</p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/10">
              <p className="text-[#f0fdf4] text-sm font-semibold mb-1">Comment signaler un bug ?</p>
              <p className="text-[#86efac]/50 text-xs leading-relaxed">Utilisez le bouton &ldquo;Contacter le support&rdquo; ci-dessous pour nous signaler tout problème.</p>
            </div>
          </div>
        </section>

        {/* ── Support ── */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <h2 className="text-[#f0fdf4] font-semibold text-base mb-2">Support</h2>
          <p className="text-[#86efac]/50 text-xs mb-5">Notre équipe répond dans les 24 heures, du lundi au vendredi.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://wa.me/2250777842576"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2.5 bg-[#25d366]/10 border border-[#25d366]/30 hover:border-[#25d366]/60 hover:bg-[#25d366]/15 text-[#25d366] font-semibold text-sm py-3.5 px-5 rounded-xl transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href="mailto:support.nexflow@gmail.com"
              className="flex-1 flex items-center justify-center gap-2.5 bg-white/5 border border-white/10 hover:border-[#22c55e]/50 hover:bg-[#22c55e]/5 text-[#86efac] font-semibold text-sm py-3.5 px-5 rounded-xl transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
              Email support
            </a>
          </div>
        </section>

        <p className="text-center text-[#15803d] text-xs tracking-widest pb-4">
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </main>
    </div>
  )
}
