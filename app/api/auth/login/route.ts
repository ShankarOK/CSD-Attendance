import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { AUTH_COOKIE_NAME, getAuthCookieOptions, signAuthToken, type UserRole } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const sql = neon(process.env.DATABASE_URL!)

type LoginBody = {
  username?: string
  password?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody
    const username = (body.username || '').trim()
    const password = body.password || ''

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    const result = await sql`
      SELECT id, username, password_hash, role, teacher_id
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const user = result[0] as {
      id: number
      username: string
      password_hash: string
      role: UserRole
      teacher_id: number | null
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const sessionId = randomUUID()
    const userAgent = request.headers.get('user-agent') || null
    await sql`
      INSERT INTO sessions (id, user_id, user_agent)
      VALUES (${sessionId}, ${user.id}, ${userAgent})
    `

    const token = await signAuthToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      teacherId: user.teacher_id,
      sessionId,
    })

    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions())

    return NextResponse.json(
      { success: true, user: { id: user.id, username: user.username, role: user.role, teacherId: user.teacher_id } },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

