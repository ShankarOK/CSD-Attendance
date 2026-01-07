/**
 * Utility functions for attendance report formatting and calculations
 */

/**
 * Formats a date string to DD/MM/YYYY format
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDateAcademic(dateString: string): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear())
    
    return `${day}/${month}/${year}`
  } catch {
    return ''
  }
}

/**
 * Gets the day name from a date string
 * @param dateString - ISO date string
 * @returns Day name (e.g., "Monday")
 */
export function getDayName(dateString: string): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[date.getDay()]
  } catch {
    return ''
  }
}

/**
 * Formats time string to HH:MM AM/PM format
 * @param timeString - 24-hour time string (HH:MM)
 * @returns Formatted time string (HH:MM AM/PM)
 */
export function formatTimeAcademic(timeString: string): string {
  if (!timeString) return ''
  
  try {
    const [hours, minutes] = timeString.split(':')
    if (!hours || !minutes) return timeString
    
    const hour24 = parseInt(hours, 10)
    const minute = parseInt(minutes, 10)
    
    if (isNaN(hour24) || isNaN(minute)) return timeString
    
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    
    return `${String(hour12).padStart(2, '0')}:${minutes} ${ampm}`
  } catch {
    return timeString
  }
}

/**
 * Calculates absent students with validation
 * @param total - Total number of students
 * @param present - Number of students present
 * @returns Calculated absent count (clamped to valid range)
 */
export function calculateAbsent(total: number, present: number): number {
  if (!total || total <= 0) return 0
  if (!present || present < 0) return total
  
  const absent = total - present
  return Math.max(0, Math.min(absent, total))
}

/**
 * Calculates attendance percentage with validation
 * @param total - Total number of students
 * @param present - Number of students present
 * @returns Percentage rounded to 2 decimal places (clamped to 0-100)
 */
export function calculatePercentage(total: number, present: number): number {
  if (!total || total <= 0) return 0
  if (!present || present < 0) return 0
  
  const percentage = (present / total) * 100
  return Math.min(100, Math.max(0, Math.round(percentage * 100) / 100))
}

/**
 * Validates attendance report data structure
 * @param data - Data to validate
 * @returns true if valid, false otherwise
 */
export function validateReportData(data: unknown): data is import('./types').AttendanceReport {
  if (!data || typeof data !== 'object') return false
  
  const report = data as Record<string, unknown>
  
  // Check required fields
  const requiredFields = [
    'program', 'department', 'academicYear', 'semester',
    'classTeacher', 'courseTitle', 'courseCode', 'courseFaculty',
    'date', 'totalStudents', 'present', 'hours'
  ]
  
  for (const field of requiredFields) {
    if (!(field in report)) return false
  }
  
  // Validate numeric fields
  if (typeof report.totalStudents !== 'number' || report.totalStudents < 1) return false
  if (typeof report.present !== 'number' || report.present < 0) return false
  if (!Array.isArray(report.hours) || report.hours.length !== 8) return false
  
  return true
}

/**
 * Generates academic year options based on current year
 * Returns current year and two ranges around it
 * @returns Array of academic year strings (e.g., ["2024-25", "2025-26", "2026-27"])
 */
export function getAcademicYearOptions(): string[] {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  
  // Previous year
  const prevYear = `${currentYear - 1}-${String(currentYear).slice(-2)}`
  // Current year
  const currYear = `${currentYear}-${String(currentYear + 1).slice(-2)}`
  // Next year
  const nextYear = `${currentYear + 1}-${String(currentYear + 2).slice(-2)}`
  
  years.push(prevYear, currYear, nextYear)
  return years
}

/**
 * Maps semester number to class teacher name
 * Mock data for now
 * @param semester - Semester number (1-8)
 * @returns Class teacher name
 */
export function getClassTeacherBySemester(semester: string | number): string {
  const sem = typeof semester === 'string' ? parseInt(semester, 10) : semester
  
  const teacherMap: Record<number, string> = {
    1: 'Mr. Manjunatha G',
    2: 'Dr. Ramesh Kumar',
    3: 'Prof. Sunita Sharma',
    4: 'Mr. Anil Kumar',
    5: 'Dr. Priya Patel',
    6: 'Mr. Rajesh Singh',
    7: 'Dr. Meera Nair',
    8: 'Prof. Vikram Reddy',
  }
  
  return teacherMap[sem] || 'Not Assigned'
}

/**
 * Course data structure
 */
export interface Course {
  code: string
  title: string
}

/**
 * Mock course data - Course code and title mapping
 */
export const COURSES: Course[] = [
  { code: 'CS101', title: 'Programming Fundamentals' },
  { code: 'CS102', title: 'Data Structures and Algorithms' },
  { code: 'CS201', title: 'Object-Oriented Programming' },
  { code: 'CS202', title: 'Database Management Systems' },
  { code: 'CS301', title: 'Computer Networks' },
  { code: 'CS302', title: 'Operating Systems' },
  { code: 'CS401', title: 'Software Engineering' },
  { code: 'CS402', title: 'Web Technologies' },
  { code: 'CS501', title: 'Machine Learning' },
  { code: 'CS502', title: 'Cloud Computing' },
  { code: 'CS601', title: 'Artificial Intelligence' },
  { code: 'CS602', title: 'Cybersecurity' },
  { code: 'CS701', title: 'Big Data Analytics' },
  { code: 'CS702', title: 'Internet of Things' },
  { code: 'CS801', title: 'Project Management' },
  { code: 'CS802', title: 'Research Methodology' },
]

/**
 * Mock faculty data
 */
export const FACULTY: string[] = [
  'Dr. Ramesh Kumar',
  'Prof. Sunita Sharma',
  'Mr. Anil Kumar',
  'Dr. Priya Patel',
  'Mr. Rajesh Singh',
  'Dr. Meera Nair',
  'Prof. Vikram Reddy',
  'Dr. Arjun Desai',
  'Prof. Kavita Menon',
  'Mr. Suresh Iyer',
  'Dr. Neha Gupta',
  'Prof. Amit Joshi',
]

/**
 * Gets course by code
 * @param code - Course code
 * @returns Course object or null
 */
export function getCourseByCode(code: string): Course | null {
  return COURSES.find(course => course.code === code) || null
}

/**
 * Gets course by title
 * @param title - Course title
 * @returns Course object or null
 */
export function getCourseByTitle(title: string): Course | null {
  return COURSES.find(course => course.title === title) || null
}

/**
 * Maps semester number to total number of students
 * Mock data for now
 * @param semester - Semester number (1-8)
 * @returns Total number of students
 */
export function getTotalStudentsBySemester(semester: string | number): number {
  const sem = typeof semester === 'string' ? parseInt(semester, 10) : semester
  
  const studentsMap: Record<number, number> = {
    1: 50,
    2: 48,
    3: 52,
    4: 49,
    5: 51,
    6: 47,
    7: 53,
    8: 45,
  }
  
  return studentsMap[sem] || 50
}

/**
 * Validates that end time is after start time
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns true if end time is after start time, false otherwise
 */
export function validateTimeRange(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return true // Allow empty values
  
  try {
    const [startHours, startMinutes] = startTime.split(':').map(Number)
    const [endHours, endMinutes] = endTime.split(':').map(Number)
    
    const startTotal = startHours * 60 + startMinutes
    const endTotal = endHours * 60 + endMinutes
    
    return endTotal > startTotal
  } catch {
    return false
  }
}

