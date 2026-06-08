import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

/* ── types retournés ── */

export type EvolutionPoint = { date: string; count: number }
export type SourcePoint    = { source: string; count: number }
export type UrgencePoint   = { name: string; value: number; color: string }
export type MotifPoint     = { motif: string; count: number }

export type AnalyticsPayload = {
  evolution : EvolutionPoint[]
  sources   : SourcePoint[]
  urgences  : UrgencePoint[]
  motifs    : MotifPoint[]
}

/* ── helpers date ── */

function fmtDay(d: Date) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function fmtMonth(d: Date) {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}
function weekKey(d: Date) {
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1   // lundi = 0
  const mon = new Date(d); mon.setDate(d.getDate() - day); mon.setHours(0, 0, 0, 0)
  return fmtDay(mon)
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

/* ── route GET /api/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD ── */

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const now = new Date()

  /* Résolution des dates — priorité à from/to, fallback sur period */
  let fromStr = sp.get('from')
  let toStr   = sp.get('to')

  if (!fromStr || !toStr) {
    const period = sp.get('period') ?? '30d'
    toStr = isoDate(now)
    switch (period) {
      case '7d':  fromStr = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)); break
      case '3m':  fromStr = isoDate(new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())); break
      case '1y':  fromStr = isoDate(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())); break
      default:    fromStr = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29))
    }
  }

  const startDate = new Date(fromStr + 'T00:00:00.000Z')
  const endDate   = new Date(toStr   + 'T23:59:59.999Z')

  /* Requête Supabase */
  const { data, error } = await supabaseAdmin
    .from('fiches')
    .select('created_at, source, urgence, motif')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[analytics] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as { created_at: string; source: string; urgence: string; motif: string }[]

  /* ── Granularité auto selon la plage ── */

  const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)
  const granularity: 'day' | 'week' | 'month' =
    rangeDays <= 31  ? 'day'   :
    rangeDays <= 180 ? 'week'  : 'month'

  /* ── 1. Évolution ── */

  const evolutionMap = new Map<string, number>()

  if (granularity === 'day') {
    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      evolutionMap.set(fmtDay(new Date(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate())), 0)
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    for (const row of rows) {
      const d   = new Date(row.created_at)
      const k   = fmtDay(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      if (evolutionMap.has(k)) evolutionMap.set(k, (evolutionMap.get(k) ?? 0) + 1)
    }
  } else if (granularity === 'week') {
    const cursor = new Date(startDate)
    while (cursor <= endDate) {
      const k = weekKey(new Date(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()))
      evolutionMap.set(k, 0)
      cursor.setUTCDate(cursor.getUTCDate() + 7)
    }
    for (const row of rows) {
      const d = new Date(row.created_at)
      const k = weekKey(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      if (evolutionMap.has(k)) evolutionMap.set(k, (evolutionMap.get(k) ?? 0) + 1)
    }
  } else {
    // month
    const cursor = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1)
    const end    = new Date(endDate.getUTCFullYear(),   endDate.getUTCMonth(),   1)
    while (cursor <= end) {
      evolutionMap.set(fmtMonth(cursor), 0)
      cursor.setMonth(cursor.getMonth() + 1)
    }
    for (const row of rows) {
      const d = new Date(row.created_at)
      const k = fmtMonth(new Date(d.getUTCFullYear(), d.getUTCMonth(), 1))
      if (evolutionMap.has(k)) evolutionMap.set(k, (evolutionMap.get(k) ?? 0) + 1)
    }
  }

  const evolution: EvolutionPoint[] = Array.from(evolutionMap.entries()).map(([date, count]) => ({ date, count }))

  /* ── 2. Sources ── */

  const SOURCE_LIST = ['Appel', 'Facebook', 'WhatsApp', 'Site web', 'Apimo', 'Visite directe', 'Recommandation', 'Autre']
  const srcMap: Record<string, number> = {}
  for (const s of SOURCE_LIST) srcMap[s] = 0
  for (const row of rows) {
    const s = row.source?.trim() || 'Autre'
    srcMap[s] = (srcMap[s] ?? 0) + 1
  }
  const sources: SourcePoint[] = Object.entries(srcMap)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({ source, count }))

  /* ── 3. Urgences ── */

  const urgMap: Record<string, number> = { Urgent: 0, Normal: 0, 'Pas pressé': 0 }
  for (const row of rows) {
    const u = row.urgence?.trim()
    if (u && u in urgMap) urgMap[u]++
  }
  const urgColors: Record<string, string> = {
    Urgent: '#ef4444', Normal: '#f97316', 'Pas pressé': '#22c55e',
  }
  const urgences: UrgencePoint[] = Object.entries(urgMap).map(([name, value]) => ({
    name, value, color: urgColors[name] ?? '#6b7280',
  }))

  /* ── 4. Motifs ── */

  const MOTIF_LIST = ['Achat', 'Location', 'Vente', 'Syndic', 'Autre']
  const motifMap: Record<string, number> = {}
  for (const m of MOTIF_LIST) motifMap[m] = 0
  for (const row of rows) {
    const m = row.motif?.trim() || 'Autre'
    motifMap[m] = (motifMap[m] ?? 0) + 1
  }
  const motifs: MotifPoint[] = Object.entries(motifMap)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([motif, count]) => ({ motif, count }))

  return NextResponse.json({ evolution, sources, urgences, motifs } satisfies AnalyticsPayload)
}
