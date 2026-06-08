import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { google } from 'googleapis'
import { authOptions } from '@/lib/auth'

const FOLDER_NAME = 'Nexflow - Fiches Qualification'

/** Trouve ou crée le dossier Nexflow dans le Drive de l'utilisateur */
async function getOrCreateFolder(drive: ReturnType<typeof google.drive>, name: string): Promise<string> {
  // Recherche d'un dossier existant
  const search = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  })

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id!
  }

  // Création du dossier s'il n'existe pas
  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  })

  return folder.data.id!
}

export async function POST(req: NextRequest) {
  try {
    // Vérification de la session
    const session = await getServerSession(authOptions)

    if (!session?.access_token) {
      return NextResponse.json(
        { error: 'Non authentifié — connectez votre Google Drive dans les paramètres.' },
        { status: 401 }
      )
    }

    // Corps de la requête
    const body = await req.json() as { pdf: string; filename: string }
    const { pdf, filename } = body

    if (!pdf || !filename) {
      return NextResponse.json(
        { error: 'Champs "pdf" (base64) et "filename" requis.' },
        { status: 400 }
      )
    }

    // Client OAuth2 avec le token de la session
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.access_token })
    const drive = google.drive({ version: 'v3', auth })

    // Trouver ou créer le dossier Nexflow
    const folderId = await getOrCreateFolder(drive, FOLDER_NAME)

    // Convertir le base64 (data-URL ou base64 pur) en Buffer
    const base64Data = pdf.includes(',') ? pdf.split(',')[1] : pdf
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload du PDF
    const { Readable } = await import('stream')
    const stream = Readable.from(buffer)

    const uploaded = await drive.files.create({
      requestBody: {
        name: filename,
        mimeType: 'application/pdf',
        parents: [folderId],
      },
      media: {
        mimeType: 'application/pdf',
        body: stream,
      },
      fields: 'id, name, webViewLink',
    })

    return NextResponse.json({
      success: true,
      fileId: uploaded.data.id,
      fileName: uploaded.data.name,
      webViewLink: uploaded.data.webViewLink,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
