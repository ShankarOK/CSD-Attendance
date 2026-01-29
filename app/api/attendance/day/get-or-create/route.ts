/**
 * POST /api/attendance/day/get-or-create
 * Get or create a DayAttendance record
 * 
 * Body:
 * - date: string (YYYY-MM-DD)
 * - semester: number
 * - department: string
 * - program: string
 * - academicYear: string
 * - classTeacherName: string (will be resolved to ID)
 * - totalStudents: number
 */

import { getOrCreateDayAttendance, getSessionsByDayAttendanceId, getTeacherByName } from '@/lib/db';
import { getCurrentUser } from '@/lib/middleware';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: Request) {
  try {
    // Check authentication (optional - can be removed if teachers don't need to login)
    // For now, we'll allow unauthenticated requests but log them
    const user = await getCurrentUser();
    
    const body = await request.json();
    const {
      date,
      semester,
      department = 'Computer Science and Design',
      program = 'Bachelor in Engineering',
      academicYear,
      classTeacherName,
      totalStudents,
    } = body;

    // Validate required fields
    if (!date || !semester || !academicYear || !classTeacherName || totalStudents === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, semester, academicYear, classTeacherName, totalStudents' },
        { status: 400 }
      );
    }

    // Resolve teacher ID from name
    const teacher = await getTeacherByName(classTeacherName);
    if (!teacher) {
      return NextResponse.json(
        { error: `Teacher "${classTeacherName}" not found` },
        { status: 404 }
      );
    }

    // Get or create day attendance
    const dayAttendance = await getOrCreateDayAttendance({
      date,
      semester: parseInt(semester.toString(), 10),
      department,
      program,
      academicYear,
      classTeacherId: teacher.id,
      totalStudents: parseInt(totalStudents.toString(), 10),
    });

    // Get all sessions for this day
    const sessions = await getSessionsByDayAttendanceId(dayAttendance.id);

    return NextResponse.json({
      dayAttendance: {
        ...dayAttendance,
        date: dayAttendance.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      },
      sessions: sessions.map(s => ({
        ...s,
        start_time: s.start_time, // Already in HH:MM:SS format
        end_time: s.end_time,
      })),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error in get-or-create day attendance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get or create day attendance' },
      { status: 500 }
    );
  }
}
