import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const sql = neon(process.env.DATABASE_URL!)

/**
 * GET /api/admin/sessions
 * List all active sessions (admin only)
 */
export async function GET() {
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

    const rows = await sql`
      SELECT s.id, s.user_id, s.created_at, s.user_agent,
             u.username, u.role
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      ORDER BY s.created_at DESC
    `

    const sessions = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      role: r.role,
      createdAt: r.created_at,
      userAgent: r.user_agent,
    }))

    return NextResponse.json(sessions)
  } catch (err) {
    console.error('Error listing sessions:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
