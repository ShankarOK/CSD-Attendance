/**
 * Type definitions for attendance report system
 */

/**
 * Represents a single hour entry in the attendance table
 */
export interface HourEntry {
  /** Hour number (1-8) */
  hour: number;
  /** Room number for this hour */
  room: string;
  /** Start time in HH:MM format */
  start: string;
  /** End time in HH:MM format */
  end: string;
  /** Course code for this hour */
  courseCode?: string;
  /** Course faculty ID or name for this hour */
  courseFaculty?: string;
  /** Number of students present for this hour */
  present?: number;
}

/**
 * Complete attendance report data structure
 */
export interface AttendanceReport {
  /** Program name (e.g., "Computer Science & Design") */
  program: string;
  /** Department name */
  department: string;
  /** Academic year (e.g., "2025-26") */
  academicYear: string;
  /** Semester number (1-8) */
  semester: string;
  /** Section identifier (optional) */
  section: string;
  /** Class teacher name */
  classTeacher: string;
  /** Course title */
  courseTitle: string;
  /** Course code (e.g., "CS301") */
  courseCode: string;
  /** Course faculty name */
  courseFaculty: string;
  /** Date in ISO format (YYYY-MM-DD) */
  date: string;
  /** Total number of students enrolled */
  totalStudents: number;
  /** Number of students present */
  present: number;
  /** Number of students absent (auto-calculated) */
  absent: number;
  /** Attendance percentage (auto-calculated, 0-100) */
  percentage: number;
  /** General room number */
  room: string;
  /** General start time */
  startTime: string;
  /** General end time */
  endTime: string;
  /** Array of 8 hour entries */
  hours: HourEntry[];
  /** Remarks by HOD */
  remarks: string;
}

