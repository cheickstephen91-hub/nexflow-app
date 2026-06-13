'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { supabase } from '@/lib/supabase'
import { getUserProfile, getAgents, fetchAsDataUrl, type Agent } from '@/lib/user-profile'
import { PageContainer, FormSection, FormCard } from '@/components/ui/nexflow'

type FormData = {
  nom_prospect: string
  telephone: string
  source: string
  motif: string
  type_bien: string
  budget: string
  localisation: string
  urgence: string
  transmettre_a: string
  commentaire: string
  agent: string
}

const INITIAL: FormData = {
  nom_prospect: '',
  telephone: '',
  source: '',
  motif: '',
  type_bien: '',
  budget: '',
  localisation: '',
  urgence: '',
  transmettre_a: '',
  commentaire: '',
  agent: '',
}

/* ── génération PDF ── */

async function generatePDF(
  data: FormData,
  options: { logoDataUrl?: string; logoFormat?: string; companyName?: string } = {}
) {
  const jsPDFModule = await import('jspdf')
  const autoTableModule = await import('jspdf-autotable')
  const jsPDF = jsPDFModule.default
  const autoTable = autoTableModule.default

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  doc.setFillColor(248, 250, 248)
  doc.rect(0, 0, pageW, 44, 'F')

  doc.setFillColor(34, 197, 94)
  doc.rect(0, 44, pageW, 1.0, 'F')

  const LOGO_H = 18
  const LOGO_MAX_W = 42
  const LOGO_Y = 10
  const usedLogoDataUrl = options.logoDataUrl ?? null
  const usedLogoFormat = (options.logoFormat ?? 'JPEG') as string
  const usedCompanyName = options.companyName || 'Nexflow'

  if (usedLogoDataUrl) {
    let logoW = LOGO_MAX_W
    try {
      const res = await fetch(usedLogoDataUrl)
      const blob = await res.blob()
      const bmp = await createImageBitmap(blob)
      const ratio = bmp.width / bmp.height
      logoW = Math.min(LOGO_MAX_W, parseFloat((LOGO_H * ratio).toFixed(2)))
      bmp.close()
    } catch {
      logoW = LOGO_MAX_W
    }
    doc.addImage(usedLogoDataUrl, usedLogoFormat, 14, LOGO_Y, logoW, LOGO_H)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(60, 90, 70)
    doc.text(usedCompanyName, 14 + logoW / 2, LOGO_Y + LOGO_H + 4, { align: 'center' })
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(34, 197, 94)
    doc.text(usedCompanyName, 14, LOGO_Y + LOGO_H / 2 + 2)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  doc.setTextColor(10, 26, 15)
  doc.text("FICHE DE QUALIFICATION D'APPEL", pageW / 2, 20, { align: 'center' })

  doc.setDrawColor(34, 197, 94)
  doc.setLineWidth(0.5)
  const titleW = doc.getTextWidth("FICHE DE QUALIFICATION D'APPEL")
  doc.line(pageW / 2 - titleW / 2, 23, pageW / 2 + titleW / 2, 23)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(10, 26, 15)
  doc.text(dateStr, pageW - 14, 20, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 120, 90)
  doc.text(timeStr, pageW - 14, 26, { align: 'right' })

  const LABEL_COLOR: [number, number, number] = [10, 26, 15]
  const LABEL_TEXT: [number, number, number] = [240, 253, 244]
  const ROW_ODD: [number, number, number] = [240, 253, 244]
  const ROW_EVEN: [number, number, number] = [220, 252, 231]

  const rows: [string, string][] = [
    ['Nom du prospect',      data.nom_prospect   || '—'],
    ['Telephone',            data.telephone      || '—'],
    ['Source du contact',    data.source         || '—'],
    ['Motif de la demande',  data.motif          || '—'],
    ['Type de bien',         data.type_bien      || '—'],
    ['Budget',               data.budget         || '—'],
    ['Localisation souhaitee', data.localisation || '—'],
    ["Niveau d'urgence",     data.urgence        || '—'],
    ['Agent',                data.agent          || '—'],
    ['Transmettre a',        data.transmettre_a  || '—'],
    ['Commentaire',          data.commentaire    || '—'],
  ]

  autoTable(doc, {
    startY: 52,
    head: [['Champ', 'Information']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: LABEL_COLOR,
      textColor: LABEL_TEXT,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
      textColor: [30, 40, 35],
    },
    alternateRowStyles: {
      fillColor: ROW_EVEN,
    },
    styles: {
      fillColor: ROW_ODD,
    },
    columnStyles: {
      0: {
        fontStyle: 'bold',
        cellWidth: 62,
        textColor: [10, 26, 15],
        fillColor: [209, 250, 229],
      },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
    tableLineColor: [187, 247, 208],
    tableLineWidth: 0.3,
    didDrawPage: () => {
      doc.setDrawColor(34, 197, 94)
      doc.setLineWidth(0.4)
      doc.line(14, pageH - 13, pageW - 14, pageH - 13)

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(80, 120, 90)
      doc.text(
        `${usedCompanyName}  —  Propulsé par Nexflow Digital Solutions  —  Confidentiel`,
        pageW / 2,
        pageH - 7,
        { align: 'center' }
      )
      doc.setDrawColor(34, 197, 94)
      doc.setLineWidth(0.4)
      doc.line(14, pageH - 12, pageW - 14, pageH - 12)
    },
  })

  const safeName = (data.nom_prospect || 'Inconnu')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
  const fileDateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\//g, '-')

  const filename = `Fiche_${safeName}_${fileDateStr}.pdf`
  doc.save(filename)

  const pdfBase64 = doc.output('datauristring')
  return { pdfBase64, filename }
}

/* ── icônes inline ── */

const IcoUser = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const IcoPhone = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const IcoBudget = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
)

const IcoForward = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 17 20 12 15 7"/>
    <path d="M4 18v-2a4 4 0 0 1 4-4h12"/>
  </svg>
)

/* ── composants de formulaire v2 ── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold tracking-widest uppercase mb-1.5"
      style={{ color: 'var(--muted-foreground)' }}>
      {children}
    </label>
  )
}

function InputField({
  name, value, onChange, placeholder, type = 'text', trailingIcon,
}: {
  name: keyof FormData
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  trailingIcon?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all${trailingIcon ? ' pr-10' : ''}`}
        style={{
          background: 'var(--input)',
          border: `1px solid ${focused ? 'var(--ring)' : 'var(--input-border)'}`,
          color: 'var(--foreground)',
          boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--ring) 15%, transparent)' : 'none',
        }}
      />
      {trailingIcon && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
          style={{ color: focused ? 'var(--primary)' : 'var(--muted-foreground)' }}
        >
          {trailingIcon}
        </span>
      )}
    </div>
  )
}

function SelectField({
  name, value, onChange, options,
}: {
  name: keyof FormData
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl px-4 py-3 pr-9 text-sm outline-none transition-all appearance-none cursor-pointer"
        style={{
          background: 'var(--input)',
          border: `1px solid ${focused ? 'var(--ring)' : 'var(--input-border)'}`,
          color: value ? 'var(--foreground)' : 'var(--muted-foreground)',
          boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--ring) 15%, transparent)' : 'none',
        }}
      >
        <option value="" disabled>Sélectionner…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--muted-foreground)' }}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </span>
    </div>
  )
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>
}

/* ── page principale ── */

export default function NouvelleFiche() {
  const { data: session } = useSession()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [savedForm, setSavedForm] = useState<FormData>(INITIAL)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [driveStatus, setDriveStatus] = useState<'idle' | 'uploading' | 'ok' | 'error'>('idle')
  const [driveLink, setDriveLink] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [profileLogoDataUrl, setProfileLogoDataUrl] = useState<string | null>(null)
  const [profileLogoFormat, setProfileLogoFormat] = useState<string>('JPEG')
  const [companyName, setCompanyName] = useState<string>('')

  useEffect(() => {
    if (!session?.user?.email) return
    const email = session.user.email
    getAgents(email).then(setAgents)
    getUserProfile(email).then(async (p) => {
      if (p?.nom_entreprise) setCompanyName(p.nom_entreprise)
      if (p?.logo_url) {
        const dataUrl = await fetchAsDataUrl(p.logo_url)
        if (dataUrl) {
          setProfileLogoDataUrl(dataUrl)
          const fmt = p.logo_url.toLowerCase().includes('.png') ? 'PNG'
            : p.logo_url.toLowerCase().includes('.webp') ? 'WEBP' : 'JPEG'
          setProfileLogoFormat(fmt)
        }
      }
    })
  }, [session])

  function handleInput(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: sbError } = await supabase.from('fiches').insert([{
      ...form,
      user_email: session?.user?.email ?? null,
    }])

    if (sbError) {
      setError(sbError.message)
      setLoading(false)
      return
    }

    setSavedForm({ ...form })

    let pdfResult: { pdfBase64: string; filename: string } | null = null
    try {
      pdfResult = await generatePDF(form, {
        logoDataUrl: profileLogoDataUrl ?? undefined,
        logoFormat: profileLogoFormat,
        companyName: companyName || undefined,
      })
    } catch {
      /* le PDF est bonus : ne pas bloquer si erreur */
    }

    if (pdfResult && session?.access_token) {
      setDriveStatus('uploading')
      try {
        const res = await fetch('/api/drive/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdf: pdfResult.pdfBase64,
            filename: pdfResult.filename,
          }),
        })
        const json = await res.json() as { success?: boolean; webViewLink?: string; error?: string }
        if (json.success) {
          setDriveStatus('ok')
          setDriveLink(json.webViewLink ?? null)
        } else {
          setDriveStatus('error')
        }
      } catch {
        setDriveStatus('error')
      }
    }

    setLoading(false)
    setSuccess(true)
  }

  async function handleDownloadAgain() {
    setPdfLoading(true)
    try {
      await generatePDF(savedForm, {
        logoDataUrl: profileLogoDataUrl ?? undefined,
        logoFormat: profileLogoFormat,
        companyName: companyName || undefined,
      })
    } finally {
      setPdfLoading(false)
    }
  }

  function resetForm() {
    setForm(INITIAL)
    setSavedForm(INITIAL)
    setSuccess(false)
    setError(null)
    setDriveStatus('idle')
    setDriveLink(null)
  }

  /* ── écran de confirmation ── */
  if (success) {
    return (
      <PageContainer maxWidth="sm">
        {/* Blobs décoratifs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: 'color-mix(in srgb, var(--success) 7%, transparent)' }} />
          <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: 'color-mix(in srgb, var(--success) 5%, transparent)' }} />
        </div>

        <div className="relative z-10 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <FormCard maxWidth={440}>
            <div className="text-center">
              {/* Icône succès */}
              <div className="mx-auto mb-5 w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
                }}>
                <svg className="w-8 h-8" style={{ color: 'var(--success)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>

              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                Fiche enregistr&eacute;e&nbsp;!
              </h2>
              <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>
                Le prospect{' '}
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {savedForm.nom_prospect || 'Inconnu'}
                </span>{' '}
                a bien &eacute;t&eacute; ajout&eacute;.
              </p>

              {/* Statut Drive */}
              {driveStatus === 'uploading' && (
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mt-3 mb-2"
                  style={{
                    background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                  }}>
                  <svg className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                  </svg>
                  <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                    Envoi vers Google Drive&hellip;
                  </span>
                </div>
              )}
              {driveStatus === 'ok' && (
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mt-3 mb-2"
                  style={{
                    background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
                  }}>
                  <svg viewBox="0 0 87.3 78" className="w-3.5 h-3.5 shrink-0">
                    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28.1 52H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                    <path d="M43.65 25L29.35 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 47.5C.4 48.9 0 50.45 0 52h28.1z" fill="#00ac47"/>
                    <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.2l5.9 11.75z" fill="#ea4335"/>
                    <path d="M43.65 25L57.95 0H29.35z" fill="#00832d"/>
                    <path d="M59.2 52h28.1L73.55 28.5 57.95 0 43.65 25z" fill="#2684fc"/>
                    <path d="M28.1 52l-14.3 24.8c1.35.8 2.9 1.2 4.5 1.2h50.7c1.6 0 3.15-.45 4.5-1.2L59.2 52z" fill="#ffba00"/>
                  </svg>
                  {driveLink ? (
                    <a href={driveLink} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium hover:underline"
                      style={{ color: 'var(--success)' }}>
                      Copie enregistr&eacute;e sur Google Drive &rarr;
                    </a>
                  ) : (
                    <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>
                      Copie enregistr&eacute;e sur Google Drive
                    </span>
                  )}
                </div>
              )}
              {driveStatus === 'error' && (
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mt-3 mb-2"
                  style={{
                    background: 'color-mix(in srgb, var(--destructive) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
                  }}>
                  <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--destructive)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <span className="text-xs font-medium" style={{ color: 'var(--destructive)' }}>
                    Drive non synchronis&eacute; (PDF local OK)
                  </span>
                </div>
              )}

              {/* Badge PDF téléchargé */}
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mt-1 mb-6"
                style={{
                  background: 'color-mix(in srgb, var(--success) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
                }}>
                <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--success)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>
                  PDF t&eacute;l&eacute;charg&eacute; automatiquement
                </span>
              </div>

              {/* Re-télécharger */}
              <button
                onClick={handleDownloadAgain}
                disabled={pdfLoading}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2.5 px-4 rounded-xl transition-all duration-200 mb-5 disabled:opacity-50"
                style={{
                  background: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {pdfLoading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    G&eacute;n&eacute;ration&hellip;
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Re-t&eacute;l&eacute;charger le PDF
                  </>
                )}
              </button>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-3 px-4 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    boxShadow: '0 4px 14px color-mix(in srgb, var(--primary) 30%, transparent)',
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  Nouvelle fiche
                </button>
                <Link
                  href="/tableau-de-bord"
                  className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-3 px-4 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'var(--secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  Tableau de bord
                </Link>
              </div>
            </div>
          </FormCard>
        </div>
      </PageContainer>
    )
  }

  /* ── formulaire ── */
  return (
    <PageContainer maxWidth="md">
      {/* Blobs décoratifs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'color-mix(in srgb, var(--success) 5%, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full blur-3xl"
          style={{ background: 'color-mix(in srgb, var(--success) 3%, transparent)' }} />
      </div>

      <div className="relative z-10 space-y-6">
        <FormSection
          title="Qualification d'appel"
          subtitle="Remplissez les informations collectées lors de l'appel"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          }
          iconBg="color-mix(in srgb, var(--primary) 12%, transparent)"
          iconColor="var(--primary)"
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field>
                <Label>Nom du prospect</Label>
                <InputField name="nom_prospect" value={form.nom_prospect} onChange={handleInput}
                  placeholder="Ex : Ahmed Bah" trailingIcon={IcoUser} />
              </Field>
              <Field>
                <Label>T&eacute;l&eacute;phone</Label>
                <InputField name="telephone" value={form.telephone} onChange={handleInput}
                  placeholder="Ex : +225 07 XX XX XX XX" type="tel" trailingIcon={IcoPhone} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field>
                <Label>Source du contact</Label>
                <SelectField name="source" value={form.source} onChange={handleInput}
                  options={['Appel', 'Facebook', 'WhatsApp', 'Site web', 'Apimo', 'Visite directe', 'Recommandation', 'Autre']} />
              </Field>
              <Field>
                <Label>Motif de la demande</Label>
                <SelectField name="motif" value={form.motif} onChange={handleInput}
                  options={['Achat', 'Location', 'Vente', 'Syndic', 'Autre']} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field>
                <Label>Type de bien</Label>
                <SelectField name="type_bien" value={form.type_bien} onChange={handleInput}
                  options={['Appartement', 'Villa', 'Terrain', 'Bureau', 'Commerce', 'Autre']} />
              </Field>
              <Field>
                <Label>Budget</Label>
                <InputField name="budget" value={form.budget} onChange={handleInput}
                  placeholder="Ex : 150 000 000 FCFA" trailingIcon={IcoBudget} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field>
                <Label>Localisation souhait&eacute;e</Label>
                <SelectField name="localisation" value={form.localisation} onChange={handleInput}
                  options={[
                    'Cocody', 'Plateau', 'Marcory', 'Treichville', 'Adjamé',
                    'Attécoubé', 'Yopougon', 'Abobo', 'Anyama', 'Bingerville',
                    'Songon', 'Jacqueville', 'Port-Bouët', 'Koumassi', 'Vridi',
                    'Grand-Bassam', 'Dabou', 'Autre',
                  ]} />
              </Field>
              <Field>
                <Label>Niveau d&apos;urgence</Label>
                <SelectField name="urgence" value={form.urgence} onChange={handleInput}
                  options={['Urgent', 'Normal', 'Pas pressé']} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field>
                <Label>Agent (votre nom)</Label>
                {agents.length > 0 ? (
                  <SelectField name="agent" value={form.agent} onChange={handleInput}
                    options={agents.map((a) => a.nom + (a.role ? ` — ${a.role}` : ''))} />
                ) : (
                  <InputField name="agent" value={form.agent} onChange={handleInput}
                    placeholder="Ex : Fatoumata Bah" trailingIcon={IcoUser} />
                )}
              </Field>
              <Field>
                <Label>Transmettre &agrave;</Label>
                <InputField name="transmettre_a" value={form.transmettre_a} onChange={handleInput}
                  placeholder="Ex : Mamadou Diallo" trailingIcon={IcoForward} />
              </Field>
            </div>

            <Field>
              <Label>Commentaire</Label>
              <CommentaireField
                name="commentaire"
                value={form.commentaire}
                onChange={handleInput}
              />
            </Field>

            {error && (
              <div className="flex items-start gap-3 rounded-xl px-4 py-3"
                style={{
                  background: 'color-mix(in srgb, var(--destructive) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--destructive) 40%, transparent)',
                }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--destructive)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--destructive)' }}>{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-3.5 px-6 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  boxShadow: '0 4px 14px color-mix(in srgb, var(--primary) 30%, transparent)',
                }}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Enregistrement et g&eacute;n&eacute;ration PDF&hellip;
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Enregistrer la fiche
                  </>
                )}
              </button>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-sm font-medium py-3.5 px-6 rounded-full transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  color: 'var(--muted-foreground)',
                }}
              >
                Annuler
              </Link>
            </div>

          </form>
        </FormSection>

        <p className="text-center text-xs tracking-widest pb-4" style={{ color: 'var(--muted-foreground)' }}>
          &copy; {new Date().getFullYear()}{' '}NEXFLOW &middot; DIGITAL SOLUTIONS
        </p>
      </div>
    </PageContainer>
  )
}

/* ── textarea commentaire avec focus state ── */

function CommentaireField({
  name, value, onChange,
}: {
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="Notes supplémentaires sur l'appel…"
      rows={4}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
      style={{
        background: 'var(--input)',
        border: `1px solid ${focused ? 'var(--ring)' : 'var(--input-border)'}`,
        color: 'var(--foreground)',
        boxShadow: focused ? '0 0 0 3px color-mix(in srgb, var(--ring) 15%, transparent)' : 'none',
      }}
    />
  )
}
