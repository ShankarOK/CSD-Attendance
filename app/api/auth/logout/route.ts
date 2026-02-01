import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  if (token) {
    const decoded = await verifyAuthToken(token)
    if (decoded?.sessionId) {
      await sql`DELETE FROM sessions WHERE id = ${decoded.sessionId}`
    }
  }
  cookieStore.delete(AUTH_COOKIE_NAME)
  return NextResponse.json(
    { success: true },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  )
}

