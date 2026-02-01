/**
 * GET /api/admin/archives
 * List attendance reports (day_attendance) with optional filters. Admin only.
 * Query: dateFrom, dateTo, semester
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth'
import { listDayAttendance } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const semesterParam = searchParams.get('semester')
    const semester = semesterParam ? parseInt(semesterParam, 10) : undefined
    if (semesterParam && (isNaN(semester!) || semester! < 1 || semester! > 8)) {
      return NextResponse.json({ error: 'Invalid semester' }, { status: 400 })
    }

    const records = await listDayAttendance({ dateFrom, dateTo, semester })
    return NextResponse.json(records, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch (err) {
    console.error('Error listing archives:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
