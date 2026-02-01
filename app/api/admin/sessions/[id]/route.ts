import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const sql = neon(process.env.DATABASE_URL!)

/**
 * DELETE /api/admin/sessions/[id]
 * Revoke a session (admin only)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = await verifyAuthToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sessionId = params.id?.trim()
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM sessions WHERE id = ${sessionId} RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error revoking session:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
