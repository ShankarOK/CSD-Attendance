import { isAuthenticated } from '@/lib/middleware';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/admin/teachers
 * Get all teachers
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
    
    const teachers = await sql`
      SELECT * FROM teachers
      ORDER BY name
    `;
    
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/teachers
 * Create a new teacher
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
    
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      INSERT INTO teachers (name)
      VALUES (${name})
      RETURNING *
    `;
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Teacher with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    );
  }
}

