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

/**
 * Get teacher by ID
 */
export async function getTeacherById(id: number): Promise<Teacher | null> {
  try {
    const result = await sql`
      SELECT * FROM teachers
      WHERE id = ${id}
      LIMIT 1
    `;
    return (result[0] as Teacher) || null;
  } catch (error) {
    console.error(`Error fetching teacher with id ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// Day Attendance Types and Functions
// ============================================================================

export interface DayAttendance {
  id: number;
  date: Date;
  program: string;
  department: string;
  academic_year: string;
  semester: number;
  class_teacher_id: number;
  total_students: number;
  status: 'DRAFT' | 'FINALIZED';
  created_at: Date;
  updated_at: Date;
}

export interface SessionAttendance {
  id: number;
  day_attendance_id: number;
  hour_no: number;
  room_no: string | null;
  start_time: string; // TIME format HH:MM:SS
  end_time: string; // TIME format HH:MM:SS
  course_code: string;
  faculty_id: number;
  students_present: number;
  students_absent: number;
  signature: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get or create DayAttendance record
 * Returns existing record if found, otherwise creates a new DRAFT record
 */
export async function getOrCreateDayAttendance(params: {
  date: string; // YYYY-MM-DD format
  semester: number;
  department: string;
  program: string;
  academicYear: string;
  classTeacherId: number;
  totalStudents: number;
}): Promise<DayAttendance> {
  try {
    // Try to find existing record
    const existing = await sql`
      SELECT * FROM day_attendance
      WHERE date = ${params.date}::DATE
        AND semester = ${params.semester}
        AND department = ${params.department}
        AND program = ${params.program}
        AND academic_year = ${params.academicYear}
        AND class_teacher_id = ${params.classTeacherId}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return existing[0] as DayAttendance;
    }

    // Create new record
    const result = await sql`
      INSERT INTO day_attendance (
        date, semester, department, program, academic_year,
        class_teacher_id, total_students, status
      )
      VALUES (
        ${params.date}::DATE,
        ${params.semester},
        ${params.department},
        ${params.program},
        ${params.academicYear},
        ${params.classTeacherId},
        ${params.totalStudents},
        'DRAFT'
      )
      RETURNING *
    `;

    return result[0] as DayAttendance;
  } catch (error) {
    console.error('Error getting or creating day attendance:', error);
    throw error;
  }
}

/**
 * Get DayAttendance by ID with all sessions
 */
export async function getDayAttendanceById(id: number): Promise<{
  dayAttendance: DayAttendance;
  sessions: SessionAttendance[];
} | null> {
  try {
    const dayResult = await sql`
      SELECT * FROM day_attendance
      WHERE id = ${id}
      LIMIT 1
    `;

    if (dayResult.length === 0) {
      return null;
    }

    const sessionsResult = await sql`
      SELECT * FROM session_attendance
      WHERE day_attendance_id = ${id}
      ORDER BY hour_no ASC
    `;

    return {
      dayAttendance: dayResult[0] as DayAttendance,
      sessions: sessionsResult as SessionAttendance[],
    };
  } catch (error) {
    console.error(`Error fetching day attendance ${id}:`, error);
    throw error;
  }
}

/**
 * Finalize DayAttendance (set status to FINALIZED)
 */
export async function finalizeDayAttendance(id: number): Promise<DayAttendance> {
  try {
    const result = await sql`
      UPDATE day_attendance
      SET status = 'FINALIZED', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      throw new Error(`DayAttendance with id ${id} not found`);
    }

    return result[0] as DayAttendance;
  } catch (error) {
    console.error(`Error finalizing day attendance ${id}:`, error);
    throw error;
  }
}

/**
 * Upsert SessionAttendance (insert or update)
 */
export async function upsertSessionAttendance(params: {
  dayAttendanceId: number;
  hourNo: number;
  roomNo?: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  courseCode: string;
  facultyId: number;
  studentsPresent: number;
  studentsAbsent: number;
  signature?: string;
}): Promise<SessionAttendance> {
  try {
    // Convert HH:MM to HH:MM:SS for TIME type
    const startTimeFormatted = params.startTime.includes(':') && params.startTime.split(':').length === 2
      ? `${params.startTime}:00`
      : params.startTime;
    const endTimeFormatted = params.endTime.includes(':') && params.endTime.split(':').length === 2
      ? `${params.endTime}:00`
      : params.endTime;

    const result = await sql`
      INSERT INTO session_attendance (
        day_attendance_id, hour_no, room_no, start_time, end_time,
        course_code, faculty_id, students_present, students_absent, signature
      )
      VALUES (
        ${params.dayAttendanceId},
        ${params.hourNo},
        ${params.roomNo || null},
        ${startTimeFormatted}::TIME,
        ${endTimeFormatted}::TIME,
        ${params.courseCode},
        ${params.facultyId},
        ${params.studentsPresent},
        ${params.studentsAbsent},
        ${params.signature || null}
      )
      ON CONFLICT (day_attendance_id, hour_no)
      DO UPDATE SET
        room_no = EXCLUDED.room_no,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        course_code = EXCLUDED.course_code,
        faculty_id = EXCLUDED.faculty_id,
        students_present = EXCLUDED.students_present,
        students_absent = EXCLUDED.students_absent,
        signature = EXCLUDED.signature,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return result[0] as SessionAttendance;
  } catch (error) {
    console.error('Error upserting session attendance:', error);
    throw error;
  }
}

/**
 * Get all sessions for a day attendance
 */
export async function getSessionsByDayAttendanceId(dayAttendanceId: number): Promise<SessionAttendance[]> {
  try {
    const result = await sql`
      SELECT * FROM session_attendance
      WHERE day_attendance_id = ${dayAttendanceId}
      ORDER BY hour_no ASC
    `;
    return result as SessionAttendance[];
  } catch (error) {
    console.error(`Error fetching sessions for day attendance ${dayAttendanceId}:`, error);
    throw error;
  }
}

