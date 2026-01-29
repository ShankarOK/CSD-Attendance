import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, getAuthCookieOptions, signAuthToken, type UserRole } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const sql = neon(process.env.DATABASE_URL!)

type RegisterBody = {
  username?: string
  password?: string
  role?: UserRole
  teacherId?: number | null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody
    const username = (body.username || '').trim()
    const password = body.password || ''
    const role: UserRole = body.role === 'admin' ? 'admin' : 'teacher'
    const teacherId = role === 'teacher' ? (body.teacherId ?? null) : null

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    if (role === 'teacher' && (teacherId === null || !Number.isFinite(Number(teacherId)))) {
      return NextResponse.json({ error: 'Teacher selection is required' }, { status: 400 })
    }

    // If teacher account, ensure teacher exists
    if (role === 'teacher') {
      const t = await sql`SELECT id FROM teachers WHERE id = ${teacherId as number} LIMIT 1`
      if (t.length === 0) {
        return NextResponse.json({ error: 'Selected teacher not found' }, { status: 400 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const created = await sql`
      INSERT INTO users (username, password_hash, role, teacher_id)
      VALUES (${username}, ${passwordHash}, ${role}, ${teacherId})
      RETURNING id, username, role, teacher_id
    `

    const user = created[0] as { id: number; username: string; role: UserRole; teacher_id: number | null }

    // Auto-login after registration (creates session cookie)
    const token = await signAuthToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      teacherId: user.teacher_id,
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
  } catch (err: any) {
    // Duplicate username or teacher_id unique index
    if (err?.code === '23505') {
      return NextResponse.json({ error: 'Username already exists (or teacher already registered)' }, { status: 409 })
    }
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

