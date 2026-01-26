'use client'

import { AttendanceReport } from '@/lib/types'
import {
  calculateAbsent,
  calculatePercentage,
  formatDateAcademic,
  formatTimeAcademic,
  getDayName,
  validateTimeRange
} from '@/lib/utils'

interface Course {
  code: string
  title: string
  semester: number
}

interface Teacher {
  id: number
  name: string
}

import Link from 'next/link'
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
  const printOrientation: 'landscape' = 'landscape' // Always landscape
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [courseFaculty, setCourseFaculty] = useState<Teacher[]>([])
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(true)
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('')
  const [isLoadingAcademicYear, setIsLoadingAcademicYear] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [rowCount, setRowCount] = useState(1) // Start with 1 row
  const [savedRows, setSavedRows] = useState<Set<number>>(new Set()) // Track saved row indices
  const [savedRowsData, setSavedRowsData] = useState<Record<number, any>>({}) // Store saved row data
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set()) // Track rows being edited

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
      hours: Array.from({ length: 1 }, (_, i) => ({
        hour: i + 1,
        room: '',
        start: '',
        end: '',
        courseCode: '',
        courseFaculty: '',
        present: 0,
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
  const date = watch('date')
  const allFormData = watch()
  const hours = watch('hours')

  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch academic year from database on mount
  useEffect(() => {
    async function fetchAcademicYear() {
      try {
        setIsLoadingAcademicYear(true)
        const response = await fetch('/api/academic-year')
        if (!response.ok) {
          throw new Error('Failed to fetch academic year')
        }
        const data = await response.json()
        const year = data.current_academic_year || ''
        setCurrentAcademicYear(year)
        if (year) {
          setValue('academicYear', year)
        }
      } catch (error) {
        console.error('Error fetching academic year:', error)
      } finally {
        setIsLoadingAcademicYear(false)
      }
    }
    fetchAcademicYear()
  }, [setValue])

  // Fetch courses from database on mount
  useEffect(() => {
    async function fetchCourses() {
      try {
        setIsLoadingCourses(true)
        const response = await fetch('/api/courses')
        if (!response.ok) {
          throw new Error('Failed to fetch courses')
        }
        const courses = await response.json()
        setAllCourses(courses)
      } catch (error) {
        console.error('Error fetching courses:', error)
        setToast({ message: 'Failed to load courses from database', type: 'error' })
      } finally {
        setIsLoadingCourses(false)
      }
    }
    fetchCourses()
  }, [])

  // Fetch course faculty from database on mount
  useEffect(() => {
    let isCancelled = false
    const abortController = new AbortController()
    
    async function fetchFaculty() {
      try {
        setIsLoadingFaculty(true)
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const response = await fetch(`/api/teachers?role=course_faculty&_t=${timestamp}&_r=${random}`, {
          method: 'GET',
          cache: 'no-store',
          signal: abortController.signal,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': `faculty-${timestamp}-${random}`,
          },
        })
        if (!isCancelled) {
          if (!response.ok) {
            throw new Error('Failed to fetch faculty')
          }
          const faculty = await response.json()
          setCourseFaculty(faculty)
        }
      } catch (error) {
        if (!isCancelled) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching faculty:', error)
            setToast({ message: 'Failed to load faculty from database', type: 'error' })
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFaculty(false)
        }
      }
    }
    fetchFaculty()
    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [])

  // Filter courses by selected semester
  const coursesForSemester = semester
    ? allCourses.filter(course => course.semester === parseInt(semester, 10))
    : []

  // Fetch semester data and auto-populate class teacher and total students when semester changes
  useEffect(() => {
    async function fetchSemesterData() {
      if (semester) {
        try {
          const response = await fetch(`/api/semesters?semester=${semester}`)
          if (!response.ok) {
            throw new Error('Failed to fetch semester data')
          }
          const semesterData = await response.json()
          
          if (semesterData) {
            setValue('classTeacher', semesterData.class_teacher)
            setValue('totalStudents', semesterData.total_students)
          }
          
          // Reset rows when semester changes
          setRowCount(1)
          setSavedRows(new Set())
          setSavedRowsData({})
          setEditingRows(new Set())
          setValue('hours', [{
            hour: 1,
            room: '',
            start: '',
            end: '',
            courseCode: '',
            courseFaculty: '',
            present: 0,
          }])
        } catch (error) {
          console.error('Error fetching semester data:', error)
          setToast({ message: 'Failed to load semester data', type: 'error' })
        }
      }
    }
    fetchSemesterData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester]) // Only run when semester changes, not when hours changes

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

  // Validate and save a row
  const handleSaveRow = (index: number) => {
    const rowData = hours?.[index]
    if (!rowData) return

    // Validate all required fields
    if (!rowData.room || !rowData.start || !rowData.end || !rowData.courseCode || !rowData.courseFaculty) {
      setToast({ message: 'Please fill all fields in this row before saving', type: 'error' })
      return
    }

    // Validate time range - end time must be after start time
    if (!validateTimeRange(rowData.start, rowData.end)) {
      setToast({ message: 'End time must be after start time', type: 'error' })
      return
    }

    // Ensure present is not negative and doesn't exceed total students
    const presentValue = totalStudents > 0
      ? Math.min(Math.max(0, rowData.present || 0), totalStudents)
      : Math.max(0, rowData.present || 0)
    
    // Validate present cannot exceed total students
    if (totalStudents > 0 && presentValue > totalStudents) {
      setToast({ message: `Number of students present cannot exceed total students (${totalStudents})`, type: 'error' })
      return
    }

    // Calculate absent and ensure it doesn't exceed total students
    const absentValue = totalStudents > 0
      ? Math.min(Math.max(0, totalStudents - presentValue), totalStudents)
      : 0

    // Update the value if it was changed
    if (rowData.present !== presentValue) {
      setValue(`hours.${index}.present`, presentValue)
    }

    // Check if this was an edit operation
    const wasEditing = editingRows.has(index)

    // Save the row with validated values
    setSavedRows(prev => new Set([...prev, index]))
    setSavedRowsData(prev => ({ ...prev, [index]: { ...rowData, present: presentValue, absent: absentValue } }))
    setEditingRows(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
    setToast({ message: `Row ${index + 1} ${wasEditing ? 'updated' : 'saved'} successfully`, type: 'success' })
  }

  // Handle present input change to prevent negative values
  const handlePresentChange = (index: number, value: number) => {
    const clampedValue = totalStudents > 0
      ? Math.min(Math.max(0, value || 0), totalStudents)
      : Math.max(0, value || 0)
    setValue(`hours.${index}.present`, clampedValue, { shouldValidate: true })
  }

  // Handle edit row - make row editable again
  const handleEditRow = (index: number) => {
    const savedData = savedRowsData[index]
    if (!savedData) return

    // Restore the saved data to the form
    setValue(`hours.${index}.room`, savedData.room || '')
    setValue(`hours.${index}.start`, savedData.start || '')
    setValue(`hours.${index}.end`, savedData.end || '')
    setValue(`hours.${index}.courseCode`, savedData.courseCode || '')
    setValue(`hours.${index}.courseFaculty`, savedData.courseFaculty || '')
    setValue(`hours.${index}.present`, savedData.present || 0)

    // Remove from saved rows and add to editing rows
    setSavedRows(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
    setEditingRows(prev => new Set([...prev, index]))
    setToast({ message: `Row ${index + 1} is now editable`, type: 'info' })
  }

  // Add a new row
  const handleAddRow = () => {
    // Check if there are any unsaved rows (not saved and not currently being edited from saved state)
    const hasUnsavedRows = Array.from({ length: rowCount }, (_, i) => i).some(
      i => !savedRows.has(i) && !editingRows.has(i)
    )
    
    if (hasUnsavedRows) {
      setToast({ message: 'Please save or discard all rows before adding a new one', type: 'error' })
      return
    }
    
    if (savedRows.size === 0 && editingRows.size === 0) {
      setToast({ message: 'Please save at least one row before adding a new one', type: 'error' })
      return
    }
    
    const newIndex = rowCount
    setRowCount(prev => prev + 1)
    
    // Add new hour entry to form
    const currentHours = hours || []
    setValue('hours', [...currentHours, {
      hour: newIndex + 1,
      room: '',
      start: '',
      end: '',
      courseCode: '',
      courseFaculty: '',
      present: 0,
    }], { shouldDirty: true })
  }

  // Check if print is allowed (at least 1 row must be saved)
  const canPrint = savedRows.size > 0

  // Get course name by code
  const getCourseNameByCode = (code: string): string => {
    const course = coursesForSemester.find(c => c.code === code)
    return course?.title || ''
  }

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Attendance_Report_${date || 'report'}`,
    onBeforeGetContent: () => {
      setIsPrinting(true)
      if (componentRef.current) {
        componentRef.current.classList.remove('print-portrait', 'print-landscape')
        componentRef.current.classList.add('print-landscape')
        
        const styleId = 'print-orientation-style'
        let styleElement = document.getElementById(styleId) as HTMLStyleElement
        if (!styleElement) {
          styleElement = document.createElement('style')
          styleElement.id = styleId
          document.head.appendChild(styleElement)
        }
        styleElement.textContent = `@media print { @page { size: A4 landscape; margin: 0.6cm 0.8cm; } }`
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
    if (!canPrint) {
      setToast({ message: 'Please save at least one row before printing', type: 'error' })
      return
    }
    handlePrint()
  }

  // Format date with day name
  const formattedDate = date 
    ? `${formatDateAcademic(date)} (${getDayName(date)})`
    : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 sm:py-8 px-2 sm:px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header Section - No Print */}
        <div className="mb-4 sm:mb-8 no-print">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  Attendance Report Form
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  PES Institute of Technology and Management, Shimoga - Department of Computer Science and Design
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Link
                  href="/"
                  className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base rounded-lg hover:bg-gray-50"
                  title="Back to Home"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden sm:inline">Home</span>
                  <span className="sm:hidden">Back</span>
                </Link>
                <button
                  onClick={handlePrintClick}
                  disabled={isPrinting || !canPrint}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 text-sm sm:text-base"
                  aria-label={isPrinting ? 'Printing...' : canPrint ? 'Print report' : 'Save at least one row to print'}
                >
                  {isPrinting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Printing...</span>
                      <span className="sm:hidden">Printing</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span className="hidden sm:inline">Print Report</span>
                      <span className="sm:hidden">Print</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editable Printable Content */}
        <form 
          ref={componentRef} 
          className={`bg-white print-container print-centered print-${printOrientation} shadow-2xl rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden no-print-shadow`}
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

          {/* General Information - Only Top Fields */}
          <div className="print-info">
            <div className="print-info-grid print-info-grid-responsive">
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
                <input
                  type="text"
                  value={mounted ? (currentAcademicYear || '') : ''}
                  readOnly
                  className="print-field-input print-field-readonly"
                  placeholder={mounted && isLoadingAcademicYear ? 'Loading...' : mounted && !currentAcademicYear ? 'Not set' : ''}
                />
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
                {mounted && date && (
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
            </div>
          </div>

          {/* Hour Table - Editable with Course Code and Faculty in each row */}
          <div className="print-table overflow-x-auto -mx-2 sm:mx-0">
            <table className="print-table-main min-w-full">
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
                {Array.from({ length: rowCount }, (_, i) => {
                  const hourStart = watch(`hours.${i}.start`)
                  const hourEnd = watch(`hours.${i}.end`)
                  const hourPresent = Math.max(0, watch(`hours.${i}.present`) || 0)
                  const hourAbsent = totalStudents > 0 
                    ? Math.min(Math.max(0, totalStudents - hourPresent), totalStudents)
                    : 0
                  const isSaved = savedRows.has(i)
                  const isEditing = editingRows.has(i)
                  const savedData = savedRowsData[i]
                  
                  // For print, only show saved rows (not editing ones)
                  const displayRow = isSaved && savedData && !isEditing
                  const isEditable = !isSaved || isEditing
                  
                  return (
                    <tr 
                      key={i} 
                      className={`${!displayRow ? 'no-print' : ''} ${isSaved && !isEditing ? 'bg-green-50/30 transition-colors duration-200' : ''} ${isEditing ? 'bg-blue-50/30 transition-colors duration-200' : ''}`}
                    >
                      <td className="print-td print-td-center">{i + 1}</td>
                      <td className="print-td">
                        {displayRow ? (
                          <span className="print-field-display">{savedData.room || ''}</span>
                        ) : (
                          <input
                            type="text"
                            {...register(`hours.${i}.room`)}
                            className="print-table-input"
                            placeholder="Room"
                            disabled={!isEditable}
                          />
                        )}
                      </td>
                      <td className="print-td">
                        {displayRow ? (
                          <span className="print-field-display">{savedData.start ? formatTimeAcademic(savedData.start) : ''}</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <input
                              type="time"
                              {...register(`hours.${i}.start`, {
                                validate: (value) => {
                                  if (!value || !hourEnd) return true
                                  return validateTimeRange(value, hourEnd) || 'Start time must be before end time'
                                }
                              })}
                              className="print-table-input flex-1"
                              disabled={!isEditable}
                            />
                            {watch(`hours.${i}.start`) && (
                              <span className="text-xs text-gray-600 whitespace-nowrap time-display-print">
                                {formatTimeAcademic(watch(`hours.${i}.start`))}
                              </span>
                            )}
                          </div>
                        )}
                        {!isSaved && !isEditing && errors.hours?.[i]?.start && (
                          <span className="text-red-500 text-xs block">{errors.hours[i]?.start?.message}</span>
                        )}
                      </td>
                      <td className="print-td">
                        {displayRow ? (
                          <span className="print-field-display">{savedData.end ? formatTimeAcademic(savedData.end) : ''}</span>
                        ) : (
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
                              disabled={!isEditable}
                            />
                            {watch(`hours.${i}.end`) && (
                              <span className="text-xs text-gray-600 whitespace-nowrap time-display-print">
                                {formatTimeAcademic(watch(`hours.${i}.end`))}
                              </span>
                            )}
                          </div>
                        )}
                        {!isSaved && !isEditing && errors.hours?.[i]?.end && (
                          <span className="text-red-500 text-xs block">{errors.hours[i]?.end?.message}</span>
                        )}
                      </td>
                      <td className="print-td">
                        {displayRow ? (
                          <span className="print-field-display">{savedData.courseCode || ''}</span>
                        ) : (
                          <select
                            {...register(`hours.${i}.courseCode`)}
                            className="print-table-input print-field-select"
                            disabled={isLoadingCourses || !semester || !isEditable}
                          >
                            <option value=""></option>
                            {coursesForSemester.map((course) => (
                              <option key={`${course.semester}-${course.code}-${i}`} value={course.code}>
                                {course.code}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="print-td">
                        {displayRow ? (
                          <span className="print-field-display">{savedData.courseFaculty || ''}</span>
                        ) : (
                          <select
                            {...register(`hours.${i}.courseFaculty`)}
                            className="print-table-input print-field-select"
                            disabled={isLoadingFaculty || !isEditable}
                          >
                            <option value=""></option>
                            {courseFaculty.map((faculty) => (
                              <option key={`${faculty.id}-${i}`} value={faculty.name}>{faculty.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="print-td print-td-center">
                        {displayRow ? (
                          <span className="print-field-display">{Math.max(0, savedData.present || 0)}</span>
                        ) : (
                          <input
                            type="number"
                            {...register(`hours.${i}.present`, {
                              min: 0,
                              max: totalStudents || 999,
                              valueAsNumber: true,
                              validate: (value) => {
                                const numValue = Number(value)
                                if (isNaN(numValue)) return true
                                if (numValue < 0) return 'Cannot be negative'
                                if (totalStudents > 0 && numValue > totalStudents) {
                                  return `Cannot exceed total students (${totalStudents})`
                                }
                                return true
                              }
                            })}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              const clampedValue = totalStudents > 0 
                                ? Math.min(Math.max(0, value), totalStudents)
                                : Math.max(0, value)
                              handlePresentChange(i, clampedValue)
                              if (value !== clampedValue) {
                                setValue(`hours.${i}.present`, clampedValue)
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              const clampedValue = totalStudents > 0 
                                ? Math.min(Math.max(0, value), totalStudents)
                                : Math.max(0, value)
                              if (value !== clampedValue) {
                                setValue(`hours.${i}.present`, clampedValue)
                              }
                            }}
                            className="print-table-input text-center"
                            placeholder="0"
                            max={totalStudents || undefined}
                            disabled={!isEditable}
                          />
                        )}
                      </td>
                      <td className="print-td print-td-center">
                        {displayRow ? (
                          <span className="print-field-display">
                            {totalStudents > 0 
                              ? Math.min(Math.max(0, totalStudents - Math.max(0, savedData.present || 0)), totalStudents)
                              : 0}
                          </span>
                        ) : (
                          <span className="print-field-display">
                            {totalStudents > 0 ? hourAbsent : ''}
                          </span>
                        )}
                      </td>
                      <td className="print-td">
                        {isSaved && !isEditing ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 no-print">
                            <span className="inline-flex items-center justify-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200 shadow-sm">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Saved
                            </span>
                            <button
                              onClick={() => handleEditRow(i)}
                              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
                              type="button"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSaveRow(i)}
                            className={`w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm rounded-lg transition-all duration-200 font-semibold shadow-md hover:shadow-lg no-print flex items-center justify-center gap-1 ${
                              isEditing
                                ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
                                : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            }`}
                          >
                            {isEditing ? (
                              <>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span className="hidden sm:inline">Update</span>
                                <span className="sm:hidden">Upd</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save
                              </>
                            )}
                          </button>
                        )}
                        <span className="print-field-display print-only"></span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {/* Add Row Button */}
            <div className="mt-4 sm:mt-6 flex justify-end no-print">
              <button
                type="button"
                onClick={handleAddRow}
                disabled={savedRows.size === 0}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Row
              </button>
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
                  Dr. Pramod
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

