import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const sql = neon(process.env.DATABASE_URL!)

type Body = {
  currentPassword?: string
  newPassword?: string
  revokeOtherSessions?: boolean
}

/**
 * POST /api/auth/change-password
 * Change password for the logged-in user. Optionally revoke all other sessions.
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyAuthToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as Body
    const currentPassword = body.currentPassword ?? ''
    const newPassword = (body.newPassword ?? '').trim()
    const revokeOtherSessions = Boolean(body.revokeOtherSessions)

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const rows = await sql`
      SELECT id, password_hash FROM users WHERE id = ${decoded.userId} LIMIT 1
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const user = rows[0] as { id: number; password_hash: string }

    const valid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const newHash = await bcrypt.hash(newPassword, 10)
    await sql`
      UPDATE users SET password_hash = ${newHash}, updated_at = CURRENT_TIMESTAMP WHERE id = ${user.id}
    `

    if (revokeOtherSessions && decoded.sessionId) {
      await sql`
        DELETE FROM sessions WHERE user_id = ${user.id} AND id != ${decoded.sessionId}
      `
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Change password error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
