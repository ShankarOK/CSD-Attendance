import { getAllSemesters, getSemesterByNumber } from '@/lib/db';
import { NextResponse } from 'next/server';

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

/**
 * GET /api/semesters
 * Fetches all semesters or a specific semester
 * Query params: ?semester=2 (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterParam = searchParams.get('semester');

    if (semesterParam) {
      const semester = parseInt(semesterParam, 10);
      if (isNaN(semester)) {
        return NextResponse.json(
          { error: 'Invalid semester parameter' },
          { status: 400 }
        );
      }
      const semesterData = await getSemesterByNumber(semester);
      if (!semesterData) {
        return NextResponse.json(
          { error: 'Semester not found' },
          { status: 404 }
        );
      }
      // Ensure no caching for dynamic semester data
      return NextResponse.json(semesterData, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } else {
      const semesters = await getAllSemesters();
      return NextResponse.json(semesters);
    }
  } catch (error) {
    console.error('Error fetching semesters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch semesters' },
      { status: 500 }
    );
  }
}

