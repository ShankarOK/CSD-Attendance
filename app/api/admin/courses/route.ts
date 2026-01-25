import { isAuthenticated } from '@/lib/middleware';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/admin/courses
 * Get all courses
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
    
    const courses = await sql`
      SELECT * FROM courses
      ORDER BY semester, course_code
    `;
    
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/courses
 * Create a new course
 */
export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { semester, courseName, courseCode } = await request.json();
    
    if (!semester || !courseName || !courseCode) {
      return NextResponse.json(
        { error: 'Semester, course name, and course code are required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      INSERT INTO courses (semester, course_name, course_code)
      VALUES (${semester}, ${courseName}, ${courseCode})
      RETURNING *
    `;
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating course:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Course with this code already exists for this semester' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

