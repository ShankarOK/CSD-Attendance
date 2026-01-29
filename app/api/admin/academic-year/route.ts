import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/admin/academic-year
 * Get current academic year
 */
export async function GET() {
  try {
    
    const result = await sql`
      SELECT * FROM academic_year_settings
      ORDER BY id DESC
      LIMIT 1
    `;
    
    if (result.length === 0) {
      // Return default if not set
      return NextResponse.json({ current_academic_year: '' });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching academic year:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic year' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/academic-year
 * Set current academic year
 */
export async function POST(request: Request) {
  try {
    
    const { currentAcademicYear } = await request.json();
    
    if (!currentAcademicYear) {
      return NextResponse.json(
        { error: 'Academic year is required' },
        { status: 400 }
      );
    }
    
    // Check if record exists
    const existing = await sql`
      SELECT * FROM academic_year_settings
      ORDER BY id DESC
      LIMIT 1
    `;
    
    let result;
    if (existing.length > 0) {
      // Update existing
      result = await sql`
        UPDATE academic_year_settings
        SET current_academic_year = ${currentAcademicYear},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
        RETURNING *
      `;
    } else {
      // Create new
      result = await sql`
        INSERT INTO academic_year_settings (current_academic_year)
        VALUES (${currentAcademicYear})
        RETURNING *
      `;
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error setting academic year:', error);
    return NextResponse.json(
      { error: 'Failed to set academic year' },
      { status: 500 }
    );
  }
}

