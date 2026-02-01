/**
 * GET /api/attendance/day/[id]/print
 * Get print-ready data for a finalized DayAttendance
 */

import { getDayAttendanceById, getTeacherById } from '@/lib/db';
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

    // Only allow printing finalized attendance
    if (result.dayAttendance.status !== 'FINALIZED') {
      return NextResponse.json(
        { error: 'Day attendance must be finalized before printing' },
        { status: 403 }
      );
    }

    // Get teacher name for class teacher by ID
    const classTeacher = await getTeacherById(result.dayAttendance.class_teacher_id);
    const classTeacherName = classTeacher?.name || 'Unknown';

    // Get faculty names for each session
    const sessionsWithFaculty = await Promise.all(
      result.sessions.map(async (session) => {
        const faculty = await getTeacherById(session.faculty_id);
        return {
          ...session,
          facultyName: faculty?.name || 'Unknown',
        };
      })
    );

    return NextResponse.json({
      dayAttendance: {
        ...result.dayAttendance,
        date: result.dayAttendance.date.toISOString().split('T')[0],
        classTeacherName,
      },
      sessions: sessionsWithFaculty.map(s => ({
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
    console.error('Error fetching print data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch print data' },
      { status: 500 }
    );
  }
}
