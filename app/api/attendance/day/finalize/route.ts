/**
 * POST /api/attendance/day/finalize
 * Finalize a DayAttendance (set status to FINALIZED)
 * 
 * Body:
 * - dayAttendanceId: number
 */

import { finalizeDayAttendance, getDayAttendanceById, getSessionsByDayAttendanceId } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dayAttendanceId } = body;

    if (!dayAttendanceId) {
      return NextResponse.json(
        { error: 'Missing required field: dayAttendanceId' },
        { status: 400 }
      );
    }

    // Check if day attendance exists
    const existing = await getDayAttendanceById(dayAttendanceId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Day attendance not found' },
        { status: 404 }
      );
    }

    // Check if already finalized
    if (existing.dayAttendance.status === 'FINALIZED') {
      return NextResponse.json(
        { error: 'Day attendance is already finalized' },
        { status: 400 }
      );
    }

    // Check if at least one session exists
    const sessions = await getSessionsByDayAttendanceId(dayAttendanceId);
    if (sessions.length === 0) {
      return NextResponse.json(
        { error: 'Cannot finalize day attendance without at least one session' },
        { status: 400 }
      );
    }

    // Finalize
    const finalized = await finalizeDayAttendance(dayAttendanceId);

    return NextResponse.json({
      dayAttendance: {
        ...finalized,
        date: finalized.date.toISOString().split('T')[0],
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error finalizing day attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to finalize day attendance' },
      { status: 500 }
    );
  }
}
