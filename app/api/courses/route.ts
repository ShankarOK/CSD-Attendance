import { getAllCourses, getCoursesBySemester } from '@/lib/db';
import { NextResponse } from 'next/server';

/**
 * GET /api/courses
 * Fetches all courses or courses by semester
 * Query params: ?semester=2 (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const semesterParam = searchParams.get('semester');

    let courses;

    if (semesterParam) {
      const semester = parseInt(semesterParam, 10);
      if (isNaN(semester)) {
        return NextResponse.json(
          { error: 'Invalid semester parameter' },
          { status: 400 }
        );
      }
      courses = await getCoursesBySemester(semester);
    } else {
      courses = await getAllCourses();
    }

    // Transform database format to component format
    const transformedCourses = courses.map((course) => ({
      code: course.course_code,
      title: course.course_name,
      semester: course.semester,
    }));

    return NextResponse.json(transformedCourses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

