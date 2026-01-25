import { getAllTeachers, getClassTeachers, getCourseFaculty } from '@/lib/db';
import { NextResponse } from 'next/server';

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

/**
 * GET /api/teachers
 * Fetches teachers based on role
 * Query params: ?role=course_faculty|class_teacher (optional, defaults to all)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let teachers;

    if (role === 'course_faculty') {
      teachers = await getCourseFaculty();
    } else if (role === 'class_teacher') {
      teachers = await getClassTeachers();
    } else {
      teachers = await getAllTeachers();
    }

    // Transform to simpler format for frontend
    const transformedTeachers = teachers.map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
    }));

    return NextResponse.json(transformedTeachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

