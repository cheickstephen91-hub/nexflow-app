import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `Tu es NexBot, l'assistant IA intégré dans Nexflow — plateforme de qualification des appels entrants pour agences immobilières en Côte d'Ivoire.

Tu as deux rôles :
1. AIDE APP : tu expliques comment utiliser Nexflow (formulaire de qualification, tableau de bord, rôles Admin/Superviseur/Négociateur, invitations équipe, exports PDF, stats analytics)
2. CONSEILS MÉTIER : tu aides les négociateurs avec scripts d'appel, gestion objections, qualification prospects, techniques closing, marché immobilier d'Abidjan

Règles :
- Réponds toujours en français
- Sois concis, professionnel et actionnable
- Donne des exemples concrets adaptés au contexte ivoirien
- Contact support : support.nexflow@gmail.com | WhatsApp : +225 07 77 842 576`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })
    const message = (response.content[0] as { type: string; text: string }).text
    return NextResponse.json({ message })
  } catch (error) {
    console.error('[chatbot] Error:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération de la réponse' }, { status: 500 })
  }
}
