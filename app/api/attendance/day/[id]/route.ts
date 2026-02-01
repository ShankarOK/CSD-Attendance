/**
 * GET /api/attendance/day/[id]
 * Get DayAttendance by ID with all sessions
 */

import { getDayAttendanceById } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid day attendance ID' },
        { status: 400 }
      );
    }

    const result = await getDayAttendanceById(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Day attendance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      dayAttendance: {
        ...result.dayAttendance,
        date: result.dayAttendance.date.toISOString().split('T')[0],
      },
      sessions: result.sessions.map(s => ({
        ...s,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching day attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch day attendance' },
      { status: 500 }
    );
  }
}
