/**
 * Database utility functions for querying courses
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export interface Course {
  id: number;
  semester: number;
  course_name: string;
  course_code: string;
  created_at: Date;
  updated_at: Date;
}

export interface Semester {
  id: number;
  semester: number;
  class_teacher: string;
  total_students: number;
  created_at: Date;
  updated_at: Date;
}

export interface Teacher {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all courses
 */
export async function getAllCourses(): Promise<Course[]> {
  try {
    const result = await sql`
      SELECT * FROM courses
      ORDER BY semester, course_code
    `;
    return result as Course[];
  } catch (error) {
    console.error('Error fetching all courses:', error);
    throw error;
  }
}

/**
 * Get courses by semester
 */
export async function getCoursesBySemester(semester: number): Promise<Course[]> {
  try {
    const result = await sql`
      SELECT * FROM courses
      WHERE semester = ${semester}
      ORDER BY course_code
    `;
    return result as Course[];
  } catch (error) {
    console.error(`Error fetching courses for semester ${semester}:`, error);
    throw error;
  }
}

/**
 * Get course by course code
 */
export async function getCourseByCode(courseCode: string): Promise<Course | null> {
  try {
    const result = await sql`
      SELECT * FROM courses
      WHERE course_code = ${courseCode}
      LIMIT 1
    `;
    return (result[0] as Course) || null;
  } catch (error) {
    console.error(`Error fetching course with code ${courseCode}:`, error);
    throw error;
  }
}

/**
 * Get course by course name
 */
export async function getCourseByName(courseName: string): Promise<Course | null> {
  try {
    const result = await sql`
      SELECT * FROM courses
      WHERE course_name = ${courseName}
      LIMIT 1
    `;
    return (result[0] as Course) || null;
  } catch (error) {
    console.error(`Error fetching course with name ${courseName}:`, error);
    throw error;
  }
}

/**
 * Search courses by name or code
 */
export async function searchCourses(query: string): Promise<Course[]> {
  try {
    const searchTerm = `%${query}%`;
    const result = await sql`
      SELECT * FROM courses
      WHERE course_name ILIKE ${searchTerm}
         OR course_code ILIKE ${searchTerm}
      ORDER BY semester, course_code
      LIMIT 50
    `;
    return result as Course[];
  } catch (error) {
    console.error(`Error searching courses with query ${query}:`, error);
    throw error;
  }
}

/**
 * Get semester by semester number
 */
export async function getSemesterByNumber(semester: number): Promise<Semester | null> {
  try {
    // Ensure semester is a number
    const semesterNum = typeof semester === 'string' ? parseInt(semester, 10) : semester;
    if (isNaN(semesterNum)) {
      console.error(`Invalid semester number: ${semester}`);
      return null;
    }
    
    const result = await sql`
      SELECT * FROM semesters
      WHERE semester = ${semesterNum}
      LIMIT 1
    `;
    
    const semesterData = (result[0] as Semester) || null;
    
    // Log for debugging
    if (semesterData) {
      console.log(`[DB] Fetched semester ${semesterNum}:`, {
        id: semesterData.id,
        semester: semesterData.semester,
        class_teacher: semesterData.class_teacher,
        total_students: semesterData.total_students,
      });
    } else {
      console.warn(`[DB] No semester found for semester number: ${semesterNum}`);
    }
    
    return semesterData;
  } catch (error) {
    console.error(`Error fetching semester ${semester}:`, error);
    throw error;
  }
}

/**
 * Get all semesters
 */
export async function getAllSemesters(): Promise<Semester[]> {
  try {
    const result = await sql`
      SELECT * FROM semesters
      ORDER BY semester
    `;
    return result as Semester[];
  } catch (error) {
    console.error('Error fetching all semesters:', error);
    throw error;
  }
}

/**
 * Get all teachers
 */
export async function getAllTeachers(): Promise<Teacher[]> {
  try {
    const result = await sql`
      SELECT * FROM teachers
      ORDER BY name
    `;
    return result as Teacher[];
  } catch (error) {
    console.error('Error fetching all teachers:', error);
    throw error;
  }
}

/**
 * Get teachers who can be course faculty
 */
export async function getCourseFaculty(): Promise<Teacher[]> {
  try {
    // All teachers can be course faculty, so return all teachers
    const result = await sql`
      SELECT * FROM teachers
      ORDER BY name
    `;
    return result as Teacher[];
  } catch (error) {
    console.error('Error fetching course faculty:', error);
    throw error;
  }
}

/**
 * Get teachers who can be class teachers
 */
export async function getClassTeachers(): Promise<Teacher[]> {
  try {
    // All teachers can be class teachers
    const result = await sql`
      SELECT * FROM teachers
      ORDER BY name
    `;
    return result as Teacher[];
  } catch (error) {
    console.error('Error fetching class teachers:', error);
    throw error;
  }
}

/**
 * Get teacher by name
 */
export async function getTeacherByName(name: string): Promise<Teacher | null> {
  try {
    const result = await sql`
      SELECT * FROM teachers
      WHERE name = ${name}
      LIMIT 1
    `;
    return (result[0] as Teacher) || null;
  } catch (error) {
    console.error(`Error fetching teacher with name ${name}:`, error);
    throw error;
  }
}

