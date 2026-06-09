import { NextRequest, NextResponse } from 'next/server'

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
  const headers = {
    'Content-Type': 'application/json',
  }

  try {
    const { messages } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    // S'assurer que le premier message est 'user'
    const firstUserIndex = contents.findIndex((c: { role: string }) => c.role === 'user')
    const filteredContents = firstUserIndex >= 0 ? contents.slice(firstUserIndex) : contents

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: filteredContents
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[chatbot] Gemini API error:', JSON.stringify(data))
      return NextResponse.json({ error: 'Erreur Gemini API' }, { status: 500 })
    }

    const message = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Pas de réponse.'
    return NextResponse.json({ message }, { headers })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    const stack  = error instanceof Error ? error.stack   : undefined
    console.error('[chatbot] Error message:', errMsg)
    console.error('[chatbot] Error stack:',   stack)
    console.error('[chatbot] GEMINI_API_KEY set:', !!process.env.GEMINI_API_KEY)
    return NextResponse.json({ error: 'Erreur lors de la génération de la réponse' }, { status: 500 })
  }
}
