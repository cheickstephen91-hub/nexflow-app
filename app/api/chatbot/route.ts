import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM_PROMPT = `Tu es NexBot, l'assistant IA intégré dans Nexflow — plateforme de qualification des appels entrants pour agences immobilières en Côte d'Ivoire.

Tu as deux rôles :
1. AIDE APP : tu expliques comment utiliser Nexflow (formulaire de qualification, tableau de bord, rôles Admin/Superviseur/Négociateur, invitations équipe, exports PDF, stats analytics)
2. CONSEILS MÉTIER : tu aides les négociateurs avec scripts d'appel, gestion objections, qualification prospects, techniques closing, marché immobilier d'Abidjan

Règles :
- Réponds toujours en français
- Sois concis, professionnel et actionnable
- Donne des exemples concrets adaptés au contexte ivoirien
- Contact support : support.nexflow@gmail.com | WhatsApp : +225 07 77 842 576`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    // Sépare l'historique (tous sauf le dernier) du message courant
    // Gemini exige que history[0] soit toujours role 'user'
    let history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))
    while (history.length > 0 && history[0].role === 'model') {
      history = history.slice(1)
    }

    const lastMessage = messages[messages.length - 1]

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(lastMessage.content)
    const message = result.response.text()

    return NextResponse.json({ message })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    const stack  = error instanceof Error ? error.stack   : undefined
    console.error('[chatbot] Error message:', errMsg)
    console.error('[chatbot] Error stack:',   stack)
    console.error('[chatbot] GEMINI_API_KEY set:', !!process.env.GEMINI_API_KEY)
    return NextResponse.json({ error: 'Erreur lors de la génération de la réponse' }, { status: 500 })
  }
}
