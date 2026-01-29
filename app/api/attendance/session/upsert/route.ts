/**
 * POST /api/attendance/session/upsert
 * Upsert (insert or update) a SessionAttendance record
 * 
 * Body:
 * - dayAttendanceId: number
 * - hourNo: number (1-8)
 * - roomNo?: string
 * - startTime: string (HH:MM)
 * - endTime: string (HH:MM)
 * - courseCode: string
 * - facultyName: string (will be resolved to ID)
 * - studentsPresent: number
 * - studentsAbsent: number (auto-calculated if not provided)
 * - signature?: string
 */

import { getDayAttendanceById, getTeacherByName, upsertSessionAttendance } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      dayAttendanceId,
      hourNo,
      roomNo,
      startTime,
      endTime,
      courseCode,
      facultyName,
      studentsPresent,
      studentsAbsent,
      signature,
    } = body;

    // Validate required fields
    if (!dayAttendanceId || !hourNo || !startTime || !endTime || !courseCode || !facultyName || studentsPresent === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: dayAttendanceId, hourNo, startTime, endTime, courseCode, facultyName, studentsPresent' },
        { status: 400 }
      );
    }

    // Validate hour number
    if (hourNo < 1 || hourNo > 8) {
      return NextResponse.json(
        { error: 'hourNo must be between 1 and 8' },
        { status: 400 }
      );
    }

    // Check if day attendance exists and is not finalized
    const dayAttendance = await getDayAttendanceById(dayAttendanceId);
    if (!dayAttendance) {
      return NextResponse.json(
        { error: 'Day attendance not found' },
        { status: 404 }
      );
    }

    if (dayAttendance.dayAttendance.status === 'FINALIZED') {
      return NextResponse.json(
        { error: 'Cannot modify finalized day attendance' },
        { status: 403 }
      );
    }

    // Resolve faculty ID from name
    const faculty = await getTeacherByName(facultyName);
    if (!faculty) {
      return NextResponse.json(
        { error: `Faculty "${facultyName}" not found` },
        { status: 404 }
      );
    }

    // Validate time range
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Calculate absent if not provided
    const totalStudents = dayAttendance.dayAttendance.total_students;
    const calculatedAbsent = studentsAbsent !== undefined 
      ? studentsAbsent 
      : Math.max(0, totalStudents - studentsPresent);

    // Validate present doesn't exceed total
    if (studentsPresent > totalStudents) {
      return NextResponse.json(
        { error: `Students present (${studentsPresent}) cannot exceed total students (${totalStudents})` },
        { status: 400 }
      );
    }

    // Upsert session
    const session = await upsertSessionAttendance({
      dayAttendanceId,
      hourNo: parseInt(hourNo.toString(), 10),
      roomNo,
      startTime,
      endTime,
      courseCode,
      facultyId: faculty.id,
      studentsPresent: parseInt(studentsPresent.toString(), 10),
      studentsAbsent: calculatedAbsent,
      signature,
    });

    return NextResponse.json({
      session: {
        ...session,
        start_time: session.start_time,
        end_time: session.end_time,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error upserting session attendance:', error);
    
    // Handle unique constraint violation
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'A session for this hour already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to upsert session attendance' },
      { status: 500 }
    );
  }
}
