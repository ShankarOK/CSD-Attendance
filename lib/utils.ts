/**
 * Utility functions for attendance report formatting and calculations
 */

/** Merge class names (shadcn-style). Accepts strings and object (keys with truthy values). */
export function cn(
  ...inputs: (string | undefined | false | null | Record<string, boolean | undefined | null>)[]
): string {
  const out: string[] = []
  for (const x of inputs) {
    if (typeof x === 'string' && x) out.push(x)
    if (x && typeof x === 'object' && !Array.isArray(x)) {
      for (const [k, v] of Object.entries(x)) if (v) out.push(k)
    }
  }
  return out.join(' ')
}

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

