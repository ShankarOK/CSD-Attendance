import { isAuthenticated } from '@/lib/middleware';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/admin/semesters
 * Get all semesters
 */
export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const semesters = await sql`
      SELECT * FROM semesters
      ORDER BY semester
    `;
    
    return NextResponse.json(semesters);
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch semesters' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/semesters/[semester]
 * Update a semester
 */
export async function PUT(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { semester, classTeacher, totalStudents } = await request.json();
    
    if (!semester || !classTeacher || totalStudents === undefined) {
      return NextResponse.json(
        { error: 'Semester, class teacher, and total students are required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      UPDATE semesters
      SET class_teacher = ${classTeacher},
          total_students = ${totalStudents},
          updated_at = CURRENT_TIMESTAMP
      WHERE semester = ${semester}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Semester not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating semester:', error);
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'Class teacher does not exist' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update semester' },
      { status: 500 }
    );
  }
}

