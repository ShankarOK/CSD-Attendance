import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Force dynamic rendering since we query the database
export const dynamic = 'force-dynamic';

const sql = neon(process.env.DATABASE_URL!);

/**
 * GET /api/academic-year
 * Get current academic year (public endpoint)
 */
export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM academic_year_settings
      ORDER BY id DESC
      LIMIT 1
    `;
    
    if (result.length === 0) {
      // Return empty if not set
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

