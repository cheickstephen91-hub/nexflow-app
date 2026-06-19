import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email-verification'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
  }

  const result = await verifyEmailToken(token)

  if (!result.success) {
    return NextResponse.json({ error: result.error, email: result.email ?? null }, { status: 400 })
  }

  return NextResponse.json({ success: true, email: result.email })
}
