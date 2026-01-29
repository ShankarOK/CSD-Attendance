import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

/**
 * PUT /api/admin/courses/[id]
 * Update a course
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    
    const { semester, courseName, courseCode } = await request.json();
    const id = parseInt(params.id);
    
    if (!semester || !courseName || !courseCode) {
      return NextResponse.json(
        { error: 'Semester, course name, and course code are required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      UPDATE courses
      SET semester = ${semester},
          course_name = ${courseName},
          course_code = ${courseCode},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating course:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Course with this code already exists for this semester' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/courses/[id]
 * Delete a course
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    
    const id = parseInt(params.id);
    
    const result = await sql`
      DELETE FROM courses
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}

