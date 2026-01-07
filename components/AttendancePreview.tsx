'use client'

import { AttendanceReport } from '@/lib/types'
import {
  calculateAbsent,
  calculatePercentage,
  COURSES,
  FACULTY,
  formatDateAcademic,
  formatTimeAcademic,
  getAcademicYearOptions,
  getClassTeacherBySemester,
  getCourseByCode,
  getCourseByTitle,
  getDayName,
  getTotalStudentsBySemester,
  validateTimeRange
} from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useReactToPrint } from 'react-to-print'
import Toast from './Toast'

/**
 * Editable Attendance Preview Component
 * Users can fill the form directly on the printable document
 */
export default function AttendancePreview() {
  const componentRef = useRef<HTMLFormElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape')
  const [showOrientationDialog, setShowOrientationDialog] = useState(false)

  // Load existing data from sessionStorage if available
  const loadStoredData = (): Partial<AttendanceReport> => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('attendanceReport')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return {}
        }
      }
    }
    return {}
  }

  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue,
    formState: { errors, isDirty } 
  } = useForm<AttendanceReport>({
    defaultValues: {
      hours: Array.from({ length: 8 }, (_, i) => ({
        hour: i + 1,
        room: '',
        start: '',
        end: '',
      })),
      totalStudents: 0,
      present: 0,
      absent: 0,
      percentage: 0,
      program: 'Bachelor in Engineering',
      department: 'Computer Science and Design',
      academicYear: '',
      semester: '',
      section: '',
      classTeacher: '',
      courseTitle: '',
      courseCode: '',
      courseFaculty: '',
      date: '',
      room: '',
      startTime: '',
      endTime: '',
      remarks: '',
      ...loadStoredData(),
    },
  })

  const totalStudents = watch('totalStudents') || 0
  const present = watch('present') || 0
  const semester = watch('semester')
  const courseCode = watch('courseCode')
  const courseTitle = watch('courseTitle')
  const date = watch('date')
  const allFormData = watch()

  // Auto-populate class teacher when semester changes
  useEffect(() => {
    if (semester) {
      const teacher = getClassTeacherBySemester(semester)
      setValue('classTeacher', teacher)
      
      // Auto-populate total students when semester changes
      const total = getTotalStudentsBySemester(semester)
      setValue('totalStudents', total)
    }
  }, [semester, setValue])

  // Auto-populate course title when course code changes
  useEffect(() => {
    if (courseCode) {
      const course = getCourseByCode(courseCode)
      if (course) {
        setValue('courseTitle', course.title)
      }
    }
  }, [courseCode, setValue])

  // Auto-populate course code when course title changes
  useEffect(() => {
    if (courseTitle) {
      const course = getCourseByTitle(courseTitle)
      if (course) {
        setValue('courseCode', course.code)
      }
    }
  }, [courseTitle, setValue])

  // Auto-save to sessionStorage as user types
  useEffect(() => {
    if (isDirty) {
      const reportData: AttendanceReport = {
        ...allFormData,
        absent: calculateAbsent(totalStudents, present),
        percentage: calculatePercentage(totalStudents, present),
      }
      sessionStorage.setItem('attendanceReport', JSON.stringify(reportData))
    }
  }, [allFormData, totalStudents, present, isDirty])

  // Auto-calculate absent and percentage
  const absent = calculateAbsent(totalStudents, present)
  const percentage = calculatePercentage(totalStudents, present)

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Attendance_Report_${date || 'report'}`,
    onBeforeGetContent: () => {
      setIsPrinting(true)
      if (componentRef.current) {
        componentRef.current.classList.remove('print-portrait', 'print-landscape')
        componentRef.current.classList.add(`print-${printOrientation}`)
        
        const styleId = 'print-orientation-style'
        let styleElement = document.getElementById(styleId) as HTMLStyleElement
        if (!styleElement) {
          styleElement = document.createElement('style')
          styleElement.id = styleId
          document.head.appendChild(styleElement)
        }
        styleElement.textContent = `@media print { @page { size: A4 ${printOrientation}; margin: 0.5cm; } }`
      }
      return Promise.resolve()
    },
    onAfterPrint: () => {
      setIsPrinting(false)
      setToast({ message: 'Report printed successfully!', type: 'success' })
      const styleElement = document.getElementById('print-orientation-style')
      if (styleElement) {
        styleElement.remove()
      }
    },
    onPrintError: (error) => {
      setIsPrinting(false)
      console.error('Print error:', error)
      setToast({ message: 'Failed to print. Please try again.', type: 'error' })
      const styleElement = document.getElementById('print-orientation-style')
      if (styleElement) {
        styleElement.remove()
      }
    },
  })

  const handlePrintClick = () => {
    setShowOrientationDialog(true)
  }

  const confirmPrint = (orientation: 'portrait' | 'landscape') => {
    setPrintOrientation(orientation)
    setShowOrientationDialog(false)
    setTimeout(() => {
      handlePrint()
    }, 100)
  }

  // Format date with day name
  const formattedDate = date 
    ? `${formatDateAcademic(date)} (${getDayName(date)})`
    : ''

  // Get academic year options
  const academicYearOptions = getAcademicYearOptions()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-5xl mx-auto">
        {/* Print Orientation Dialog */}
        {showOrientationDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Select Print Orientation</h3>
              <div className="space-y-3">
                <button
                  onClick={() => confirmPrint('landscape')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
                >
                  Landscape (Recommended)
                </button>
                <button
                  onClick={() => confirmPrint('portrait')}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-semibold"
                >
                  Portrait
                </button>
                <button
                  onClick={() => setShowOrientationDialog(false)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Button */}
        <div className="mb-6 flex justify-end gap-4 no-print">
          <button
            onClick={handlePrintClick}
            disabled={isPrinting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isPrinting ? 'Printing...' : 'Print report'}
          >
            {isPrinting ? 'Printing...' : 'Print Report'}
          </button>
        </div>

        {/* Editable Printable Content */}
        <form 
          ref={componentRef} 
          className={`bg-white print-container print-centered print-${printOrientation}`}
          role="document"
          aria-label="Attendance Report"
        >
          {/* College Header Image */}
          <div className="print-header-image">
            <img 
              src="/CollegeHeader.jpeg" 
              alt="PES Institute of Technology & Management - College Header"
              className="print-header-img"
            />
          </div>

          {/* Report Title */}
          <div className="print-header">
            <h2 className="print-title">
              DAY-WISE ATTENDANCE REPORT
            </h2>
          </div>

          {/* General Information - Editable Fields */}
          <div className="print-info">
            <div className="print-info-grid">
              <div className="print-info-item">
                <span className="print-label">Program:</span>
                <input
                  type="text"
                  value="Bachelor in Engineering"
                  readOnly
                  className="print-field-input print-field-readonly"
                />
              </div>
              <div className="print-info-item">
                <span className="print-label">Department:</span>
                <input
                  type="text"
                  value="Computer Science and Design"
                  readOnly
                  className="print-field-input print-field-readonly"
                />
              </div>
              <div className="print-info-item">
                <span className="print-label">Academic Year:</span>
                <select
                  {...register('academicYear', { required: true })}
                  className="print-field-input print-field-select"
                >
                  <option value="">Select</option>
                  {academicYearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="print-info-item">
                <span className="print-label">Semester:</span>
                <select
                  {...register('semester', { required: true })}
                  className="print-field-input print-field-select"
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num}{num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="print-info-item">
                <span className="print-label">Date:</span>
                <input
                  type="date"
                  {...register('date', { required: true })}
                  className="print-field-input"
                />
                {date && (
                  <span className="print-field-display ml-2 text-xs text-gray-500">
                    ({getDayName(date)})
                  </span>
                )}
              </div>
              <div className="print-info-item">
                <span className="print-label">Class Teacher:</span>
                <input
                  type="text"
                  {...register('classTeacher', { required: true })}
                  readOnly
                  className="print-field-input print-field-readonly"
                />
              </div>
              <div className="print-info-item">
                <span className="print-label">Total No. of Students:</span>
                <input
                  type="number"
                  {...register('totalStudents', { 
                    required: true, 
                    min: 1,
                    valueAsNumber: true 
                  })}
                  className="print-field-input"
                />
              </div>
              <div className="print-info-item">
                <span className="print-label">Course Title:</span>
                <select
                  {...register('courseTitle', { required: true })}
                  className="print-field-input print-field-select"
                >
                  <option value="">Select</option>
                  {COURSES.map((course) => (
                    <option key={course.title} value={course.title}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div className="print-info-item">
                <span className="print-label">Course Code:</span>
                <select
                  {...register('courseCode', { required: true })}
                  className="print-field-input print-field-select"
                >
                  <option value="">Select</option>
                  {COURSES.map((course) => (
                    <option key={course.code} value={course.code}>{course.code}</option>
                  ))}
                </select>
              </div>
              <div className="print-info-item">
                <span className="print-label">Course Faculty:</span>
                <select
                  {...register('courseFaculty', { required: true })}
                  className="print-field-input print-field-select"
                >
                  <option value="">Select</option>
                  {FACULTY.map((faculty) => (
                    <option key={faculty} value={faculty}>{faculty}</option>
                  ))}
                </select>
              </div>
              <div className="print-info-item">
                <span className="print-label">Percentage of Attendance:</span>
                <span className="print-field-display">{percentage.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Hour Table - Editable */}
          <div className="print-table">
            <table className="print-table-main">
              <thead>
                <tr>
                  <th className="print-th">Hour No.</th>
                  <th className="print-th">Room No.</th>
                  <th className="print-th">Start Time</th>
                  <th className="print-th">End Time</th>
                  <th className="print-th">Course Code</th>
                  <th className="print-th">Course Faculty</th>
                  <th className="print-th">No. of Students Present</th>
                  <th className="print-th">No. of Students Absent</th>
                  <th className="print-th">Signature of the Faculty</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }, (_, i) => {
                  const hourStart = watch(`hours.${i}.start`)
                  return (
                    <tr key={i}>
                      <td className="print-td print-td-center">{i + 1}</td>
                      <td className="print-td">
                        <input
                          type="text"
                          {...register(`hours.${i}.room`)}
                          className="print-table-input"
                          placeholder="Room"
                        />
                      </td>
                      <td className="print-td">
                        <div className="flex items-center gap-1">
                          <input
                            type="time"
                            {...register(`hours.${i}.start`)}
                            className="print-table-input flex-1"
                          />
                          {watch(`hours.${i}.start`) && (
                            <span className="text-xs text-gray-600 whitespace-nowrap time-display-print">
                              {formatTimeAcademic(watch(`hours.${i}.start`))}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="print-td">
                        <div className="flex items-center gap-1">
                          <input
                            type="time"
                            {...register(`hours.${i}.end`, {
                              validate: (value) => {
                                if (!value || !hourStart) return true
                                return validateTimeRange(hourStart, value) || 'End time must be after start time'
                              }
                            })}
                            className="print-table-input flex-1"
                          />
                          {watch(`hours.${i}.end`) && (
                            <span className="text-xs text-gray-600 whitespace-nowrap time-display-print">
                              {formatTimeAcademic(watch(`hours.${i}.end`))}
                            </span>
                          )}
                        </div>
                        {errors.hours?.[i]?.end && (
                          <span className="text-red-500 text-xs block">{errors.hours[i]?.end?.message}</span>
                        )}
                      </td>
                      <td className="print-td">
                        {i === 0 ? (courseCode || '________________') : '________________'}
                      </td>
                      <td className="print-td">
                        {i === 0 ? (watch('courseFaculty') || '________________') : '________________'}
                      </td>
                      <td className="print-td print-td-center">
                        {i === 0 ? (present || '________________') : '________________'}
                      </td>
                      <td className="print-td print-td-center">
                        {i === 0 ? (absent || '________________') : '________________'}
                      </td>
                      <td className="print-td">{'________________'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Attendance Summary - Editable */}
          <div className="print-summary">
            <div className="print-summary-grid">
              <div className="print-summary-item">
                <span className="print-label">Total No of Students Present:</span>
                <input
                  type="number"
                  {...register('present', {
                    required: true,
                    min: 0,
                    max: totalStudents || 999,
                    valueAsNumber: true
                  })}
                  className="print-field-input"
                />
              </div>
              <div className="print-summary-item">
                <span className="print-label">Total No of Students Absent:</span>
                <span className="print-field-display">{absent}</span>
              </div>
            </div>
          </div>

          {/* Footer - Editable */}
          <div className="print-footer">
            <div className="print-remarks">
              <p className="print-label">Remarks by the HOD:</p>
              <textarea
                {...register('remarks')}
                className="print-remarks-box print-field-textarea"
                rows={2}
              />
            </div>
            <div className="print-signatures">
              <div className="print-signature-item">
                <p className="print-label">Signature of the Class Teacher</p>
                <div className="print-signature-line">
                  {watch('classTeacher') || '________________'}
                </div>
              </div>
              <div className="print-signature-item">
                <p className="print-label">Signature of the HOD</p>
                <div className="print-signature-line">
                  {'________________'}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
