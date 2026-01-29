'use client'

import { AttendanceReport } from '@/lib/types'
import {
  calculateAbsent,
  calculatePercentage,
  validateTimeRange
} from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Toast from './Toast'

/**
 * Attendance Form Component
 * Handles form input, validation, and submission for attendance reports
 */
interface Course {
  code: string
  title: string
  semester: number
}

interface Teacher {
  id: number
  name: string
}

export default function AttendanceForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [courseFaculty, setCourseFaculty] = useState<Teacher[]>([])
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(true)
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('')
  const [isLoadingAcademicYear, setIsLoadingAcademicYear] = useState(true)
  
  // Day attendance state
  const [dayAttendanceId, setDayAttendanceId] = useState<number | null>(null)
  const [dayAttendanceStatus, setDayAttendanceStatus] = useState<'DRAFT' | 'FINALIZED' | null>(null)
  const [isLoadingDayAttendance, setIsLoadingDayAttendance] = useState(false)
  const [savedSessions, setSavedSessions] = useState<Set<number>>(new Set()) // Track which hours are saved
  const [savingSession, setSavingSession] = useState<number | null>(null) // Track which hour is being saved
  const [isFinalizing, setIsFinalizing] = useState(false)

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
    },
  })

  const totalStudents = watch('totalStudents') || 0
  const present = watch('present') || 0
  const semester = watch('semester')
  const courseCode = watch('courseCode')
  const courseTitle = watch('courseTitle')
  const date = watch('date')
  const academicYear = watch('academicYear')
  const classTeacher = watch('classTeacher')

  // Fetch courses from database on mount
  useEffect(() => {
    let isCancelled = false
    const abortController = new AbortController()
    
    async function fetchCourses() {
      try {
        setIsLoadingCourses(true)
        // Add cache-busting to ensure fresh data
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const response = await fetch(`/api/courses?_t=${timestamp}&_r=${random}`, {
          method: 'GET',
          cache: 'no-store',
          signal: abortController.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': `${timestamp}-${random}`,
          },
        })
        if (!response.ok) {
          throw new Error('Failed to fetch courses')
        }
        const courses = await response.json()
        if (!isCancelled) {
          setAllCourses(courses)
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return // Request was cancelled
        }
        console.error('Error fetching courses:', error)
        if (!isCancelled) {
          setToast({ message: 'Failed to load courses. Please refresh the page.', type: 'error' })
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingCourses(false)
        }
      }
    }
    fetchCourses()
    
    return () => {
      isCancelled = true
      abortController.abort()
    }
  }, [])

  // Fetch course faculty from database on mount
  useEffect(() => {
    let isCancelled = false
    const abortController = new AbortController()
    
    async function fetchFaculty() {
      try {
        setIsLoadingFaculty(true)
        // Add cache-busting to ensure fresh data
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const response = await fetch(`/api/teachers?role=course_faculty&_t=${timestamp}&_r=${random}`, {
          method: 'GET',
          cache: 'no-store',
          signal: abortController.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': `${timestamp}-${random}`,
          },
        })
        if (!response.ok) {
          throw new Error('Failed to fetch faculty')
        }
        const faculty = await response.json()
        
        if (isCancelled) return
        
        // Validate response is an array
        if (!Array.isArray(faculty)) {
          console.error('[Form] Invalid faculty response format:', typeof faculty, faculty)
          if (!isCancelled) {
            setToast({ message: 'Invalid faculty data format. Please refresh the page.', type: 'error' })
            setCourseFaculty([])
          }
          return
        }
        
        // Validate and filter faculty data
        const validFaculty = faculty.filter((f: any) => {
          if (!f || typeof f !== 'object') {
            console.warn('[Form] Invalid faculty item:', f)
            return false
          }
          if (!f.id || !f.name) {
            console.warn('[Form] Faculty item missing required fields:', f)
            return false
          }
          return true
        })
        
        if (isCancelled) return
        
        // Log for debugging
        console.log('[Form] Fetched course faculty:', {
          total: faculty.length,
          valid: validFaculty.length,
          faculty: validFaculty.map((f: Teacher) => ({ id: f.id, name: f.name })),
        })
        
        if (validFaculty.length === 0) {
          console.warn('[Form] No valid faculty data received')
          if (!isCancelled) {
            setToast({ message: 'No faculty data available. Please check the admin panel.', type: 'error' })
            setCourseFaculty([])
          }
        } else {
          if (!isCancelled) {
            setCourseFaculty(validFaculty)
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return // Request was cancelled
        }
        console.error('Error fetching faculty:', error)
        if (!isCancelled) {
          setToast({ message: 'Failed to load faculty. Please refresh the page.', type: 'error' })
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
        setToast({ message: 'Failed to load academic year from database', type: 'error' })
      } finally {
        setIsLoadingAcademicYear(false)
      }
    }
    fetchAcademicYear()
  }, [setValue])

  // Filter courses by selected semester
  const coursesForSemester = semester
    ? allCourses.filter(course => course.semester === parseInt(semester, 10))
    : []

  // Clear course fields when semester changes
  useEffect(() => {
    if (semester && !isLoadingCourses) {
      // Clear course fields when semester changes to prevent stale data
      setValue('courseCode', '')
      setValue('courseTitle', '')
    }
  }, [semester, isLoadingCourses, setValue])

  // Auto-sync course code and course title when one changes
  useEffect(() => {
    if (!semester || coursesForSemester.length === 0 || isLoadingCourses) return

    // Find matching course based on current selections
    const courseByCode = courseCode ? coursesForSemester.find(c => c.code === courseCode) : null
    const courseByTitle = courseTitle ? coursesForSemester.find(c => c.title === courseTitle) : null

    // When course code is selected, auto-fill course title
    if (courseCode && courseByCode) {
      if (courseByCode.title !== courseTitle) {
        setValue('courseTitle', courseByCode.title, { shouldValidate: true, shouldDirty: true })
      }
    }

    // When course title is selected, auto-fill course code
    if (courseTitle && courseByTitle) {
      if (courseByTitle.code !== courseCode) {
        setValue('courseCode', courseByTitle.code, { shouldValidate: true, shouldDirty: true })
      }
    }

    // If both are set but don't match, prioritize course code
    if (courseCode && courseTitle && courseByCode && courseByCode.title !== courseTitle) {
      setValue('courseTitle', courseByCode.title, { shouldValidate: true, shouldDirty: true })
    }
  }, [courseCode, courseTitle, coursesForSemester, semester, isLoadingCourses, setValue])

  // Auto-load day attendance when date + semester + academic year selected
  // This triggers after classTeacher and totalStudents are populated from semester selection
  useEffect(() => {
    let isCancelled = false
    
    async function loadDayAttendance() {
      // Wait for classTeacher and totalStudents to be populated from semester selection
      if (!date || !semester || !academicYear) {
        // Reset state if required fields are missing
        if (!isCancelled) {
          setDayAttendanceId(null)
          setDayAttendanceStatus(null)
          setSavedSessions(new Set())
        }
        return
      }

      // Wait a bit for semester data to load (classTeacher and totalStudents)
      if (!classTeacher || !totalStudents || totalStudents === 0) {
        // Don't reset, just wait
        return
      }

      try {
        setIsLoadingDayAttendance(true)
        const response = await fetch('/api/attendance/day/get-or-create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date,
            semester: parseInt(semester, 10),
            department: 'Computer Science and Design',
            program: 'Bachelor in Engineering',
            academicYear,
            classTeacherName: classTeacher,
            totalStudents: parseInt(totalStudents.toString(), 10),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to load day attendance')
        }

        const data = await response.json()
        
        if (!isCancelled) {
          setDayAttendanceId(data.dayAttendance.id)
          setDayAttendanceStatus(data.dayAttendance.status)
          
          // Load saved sessions into form
          const savedHours = new Set<number>()
          data.sessions.forEach((session: any) => {
            const hourIndex = session.hour_no - 1
            savedHours.add(hourIndex)
            
            // Populate form fields
            setValue(`hours.${hourIndex}.room`, session.room_no || '')
            setValue(`hours.${hourIndex}.start`, session.start_time.substring(0, 5)) // Convert HH:MM:SS to HH:MM
            setValue(`hours.${hourIndex}.end`, session.end_time.substring(0, 5))
            setValue(`hours.${hourIndex}.courseCode`, session.course_code || '')
            // Set faculty ID (the dropdown uses faculty.id as value)
            setValue(`hours.${hourIndex}.courseFaculty`, session.faculty_id?.toString() || '')
            setValue(`hours.${hourIndex}.present`, session.students_present || 0)
          })
          
          setSavedSessions(savedHours)
          
          if (data.sessions.length > 0) {
            setToast({ 
              message: `Loaded ${data.sessions.length} saved session(s)`, 
              type: 'success' 
            })
          } else if (data.dayAttendance.status === 'DRAFT') {
            setToast({ 
              message: 'Day attendance created. Start filling session details.', 
              type: 'info' 
            })
          }
        }
      } catch (error: any) {
        console.error('Error loading day attendance:', error)
        if (!isCancelled) {
          setToast({ 
            message: error.message || 'Failed to load day attendance. Please try again.', 
            type: 'error' 
          })
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDayAttendance(false)
        }
      }
    }

    // Small delay to ensure semester data is loaded
    const timer = setTimeout(() => {
      loadDayAttendance()
    }, 300)

    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [date, semester, academicYear, classTeacher, totalStudents, setValue])

  // Save a single session (row)
  const handleSaveSession = async (hourIndex: number) => {
    if (!dayAttendanceId) {
      setToast({ message: 'Please select date and semester first to create day attendance', type: 'error' })
      return
    }
    
    if (dayAttendanceStatus === 'FINALIZED') {
      setToast({ message: 'Cannot save: Day attendance is finalized', type: 'error' })
      return
    }

    const hourData = watch(`hours.${hourIndex}`)
    const hourNo = hourIndex + 1

    // Validate required fields
    if (!hourData.room || !hourData.start || !hourData.end || !hourData.courseCode || !hourData.courseFaculty) {
      setToast({ message: `Please fill all fields for hour ${hourNo} before saving`, type: 'error' })
      return
    }

    // Validate time range
    if (!validateTimeRange(hourData.start, hourData.end)) {
      setToast({ message: `End time must be after start time for hour ${hourNo}`, type: 'error' })
      return
    }

    // Validate present count
    const presentValue = hourData.present || 0
    if (presentValue < 0 || presentValue > totalStudents) {
      setToast({ message: `Students present for hour ${hourNo} must be between 0 and ${totalStudents}`, type: 'error' })
      return
    }

    try {
      setSavingSession(hourIndex)
      
      // Find faculty name from ID (courseFaculty stores ID as value)
      const facultyId = parseInt(hourData.courseFaculty, 10)
      if (isNaN(facultyId)) {
        setToast({ message: 'Please select a valid faculty', type: 'error' })
        return
      }
      
      const faculty = courseFaculty.find(f => f.id === facultyId)
      if (!faculty) {
        setToast({ message: 'Invalid faculty selected. Please refresh the page.', type: 'error' })
        return
      }

      const response = await fetch('/api/attendance/session/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayAttendanceId,
          hourNo,
          roomNo: hourData.room,
          startTime: hourData.start,
          endTime: hourData.end,
          courseCode: hourData.courseCode,
          facultyName: faculty.name,
          studentsPresent: presentValue,
          studentsAbsent: Math.max(0, totalStudents - presentValue),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save session')
      }

      const result = await response.json()
      setSavedSessions(prev => new Set(prev).add(hourIndex))
      setToast({ message: `Hour ${hourNo} saved successfully ✓`, type: 'success' })
    } catch (error: any) {
      console.error('Error saving session:', error)
      setToast({ message: error.message || 'Failed to save session', type: 'error' })
    } finally {
      setSavingSession(null)
    }
  }

  // Finalize day attendance
  const handleFinalizeDay = async () => {
    if (!dayAttendanceId) {
      setToast({ message: 'No day attendance loaded', type: 'error' })
      return
    }

    if (dayAttendanceStatus === 'FINALIZED') {
      setToast({ message: 'Day attendance is already finalized', type: 'info' })
      return
    }

    if (savedSessions.size === 0) {
      setToast({ message: 'Please save at least one session before finalizing', type: 'error' })
      return
    }

    try {
      setIsFinalizing(true)
      const response = await fetch('/api/attendance/day/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dayAttendanceId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to finalize day attendance')
      }

      setDayAttendanceStatus('FINALIZED')
      setToast({ message: 'Day attendance finalized successfully! Ready for print.', type: 'success' })
    } catch (error: any) {
      console.error('Error finalizing day attendance:', error)
      setToast({ message: error.message || 'Failed to finalize day attendance', type: 'error' })
    } finally {
      setIsFinalizing(false)
    }
  }
  
  // Fetch semester data and auto-populate class teacher and total students when semester changes
  useEffect(() => {
    let isCancelled = false
    
    async function fetchSemesterData() {
      if (semester) {
        try {
          // Clear previous values first to prevent stale data
          setValue('classTeacher', '')
          setValue('totalStudents', 0)
          
          // Add cache-busting and ensure fresh data
          const semesterNum = parseInt(semester, 10)
          if (isNaN(semesterNum)) {
            console.error('Invalid semester value:', semester)
            return
          }
          
          // Add timestamp and random string to prevent caching
          const timestamp = Date.now()
          const random = Math.random().toString(36).substring(7)
          const response = await fetch(`/api/semesters?semester=${semesterNum}&_t=${timestamp}&_r=${random}`, {
            method: 'GET',
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'X-Request-ID': `${timestamp}-${random}`,
            },
          })
          
          if (!response.ok) {
            throw new Error(`Failed to fetch semester data: ${response.status}`)
          }
          
          const semesterData = await response.json()
          
          // Don't update if component unmounted or semester changed
          if (isCancelled) return
          
          // Log for debugging
          console.log(`[Form] Fetched semester ${semesterNum} data:`, semesterData)
          
          // Validate response and ensure we have the correct semester
          if (semesterData && semesterData.semester === semesterNum) {
            const classTeacher = semesterData.class_teacher || ''
            const totalStudents = semesterData.total_students || 0
            
            console.log(`[Form] Setting class teacher: "${classTeacher}", total students: ${totalStudents}`)
            
            setValue('classTeacher', classTeacher)
            setValue('totalStudents', totalStudents)
          } else {
            console.error('Semester data mismatch:', { 
              requested: semesterNum, 
              received: semesterData,
              receivedSemester: semesterData?.semester 
            })
            if (!isCancelled) {
              setValue('classTeacher', '')
              setValue('totalStudents', 0)
            }
          }
        } catch (error) {
          console.error('Error fetching semester data:', error)
          // Clear values on error to prevent stale data
          if (!isCancelled) {
            setValue('classTeacher', '')
            setValue('totalStudents', 0)
          }
        }
      } else {
        // Clear values when no semester is selected
        setValue('classTeacher', '')
        setValue('totalStudents', 0)
      }
    }
    
    fetchSemesterData()
    
    // Cleanup function to cancel in-flight requests
    return () => {
      isCancelled = true
    }
  }, [semester, setValue])
  
  // Academic year is now auto-fetched from database, no need for options

  // Track form changes for unsaved data warning
  useEffect(() => {
    setHasUnsavedChanges(isDirty)
  }, [isDirty])

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Auto-calculate absent and percentage with proper validation
  const absent = calculateAbsent(totalStudents, present)
  const percentage = calculatePercentage(totalStudents, present)

  const onSubmit = async (data: AttendanceReport) => {
    // If day attendance is finalized, redirect to print preview
    if (dayAttendanceStatus === 'FINALIZED' && dayAttendanceId) {
      router.push(`/preview?dayAttendanceId=${dayAttendanceId}`)
      return
    }

    // Otherwise, show message to finalize first
    if (!dayAttendanceId) {
      setToast({ 
        message: 'Please select date, semester, and academic year first', 
        type: 'error' 
      })
      return
    }

    if (savedSessions.size === 0) {
      setToast({ 
        message: 'Please save at least one session before finalizing', 
        type: 'error' 
      })
      return
    }

    setToast({ 
      message: 'Please click "Finalize Day" button first, then preview & print', 
      type: 'info' 
    })
  }

  const handleCancel = () => {
    if (hasUnsavedChanges && savedSessions.size > 0) {
      const confirmed = window.confirm('You have unsaved sessions. Are you sure you want to leave?')
      if (!confirmed) return
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8 px-2 sm:px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-3 sm:p-4 md:p-6 lg:p-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center">
            Create Attendance Report
          </h1>
          <p className="text-center text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm">
            Fill in all required fields marked with <span className="text-red-500">*</span>
          </p>
          
          {/* Workflow Info Banner */}
          {dayAttendanceId && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">How it works:</h3>
                  <ol className="text-xs sm:text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Select date and semester to auto-load or create day attendance</li>
                    <li>Fill each hour row with course code, faculty, times, and attendance</li>
                    <li>Click "Save" on each row to save individual sessions</li>
                    <li>Click "Finalize Day" when all sessions are complete</li>
                    <li>Preview and print the finalized attendance report</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6" noValidate>
            {/* Section 1: Header Details */}
            <section className="border-b pb-4 sm:pb-6" aria-labelledby="header-details">
              <h2 id="header-details" className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">
                Header Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                <div>
                  <label htmlFor="program" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Program <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="program"
                    type="text"
                    value="Bachelor in Engineering"
                    readOnly
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                    aria-label="Program (read-only): Bachelor in Engineering"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="department"
                    type="text"
                    value="Computer Science and Design"
                    readOnly
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                    aria-label="Department (read-only): Computer Science and Design"
                  />
                </div>

                <div>
                  <label htmlFor="academicYear" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Academic Year <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="academicYear"
                    type="text"
                    {...register('academicYear', { required: 'Academic Year is required' })}
                    value={currentAcademicYear}
                    readOnly
                    disabled={isLoadingAcademicYear}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base min-h-[44px] cursor-not-allowed"
                    aria-invalid={errors.academicYear ? 'true' : 'false'}
                    aria-describedby={errors.academicYear ? 'academicYear-error' : undefined}
                    placeholder={isLoadingAcademicYear ? 'Loading...' : 'Academic year will be auto-filled'}
                  />
                  {errors.academicYear && (
                    <p id="academicYear-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.academicYear.message}
                    </p>
                  )}
                  {!isLoadingAcademicYear && !currentAcademicYear && (
                    <p className="text-yellow-600 text-xs mt-1">
                      Academic year not set in database. Please contact administrator.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="semester" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Semester <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <select
                    id="semester"
                    {...register('semester', { required: 'Semester is required' })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                    aria-invalid={errors.semester ? 'true' : 'false'}
                    aria-describedby={errors.semester ? 'semester-error' : undefined}
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                      <option key={num} value={num}>
                        {num}
                        {num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'}
                      </option>
                    ))}
                  </select>
                  {errors.semester && (
                    <p id="semester-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.semester.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="classTeacher" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Class Teacher <span className="text-red-500" aria-label="required">*</span>
                    <span className="block sm:inline text-xs text-gray-500 sm:ml-2 mt-0.5 sm:mt-0">(Auto-selected based on semester)</span>
                  </label>
                  <input
                    id="classTeacher"
                    type="text"
                    {...register('classTeacher', { required: 'Class Teacher is required' })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                    readOnly
                    placeholder="Select semester to auto-fill"
                    value={watch('classTeacher') || ''}
                    aria-invalid={errors.classTeacher ? 'true' : 'false'}
                    aria-describedby={errors.classTeacher ? 'classTeacher-error' : undefined}
                    aria-label="Class Teacher (auto-selected based on semester)"
                  />
                  {errors.classTeacher && (
                    <p id="classTeacher-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.classTeacher.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="courseCode" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Course Code <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <select
                    id="courseCode"
                    {...register('courseCode', { required: 'Course Code is required' })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                    aria-invalid={errors.courseCode ? 'true' : 'false'}
                    aria-describedby={errors.courseCode ? 'courseCode-error' : undefined}
                    disabled={isLoadingCourses || !semester}
                  >
                    <option value="">
                      {isLoadingCourses ? 'Loading courses...' : !semester ? 'Select semester first' : 'Select Course Code'}
                    </option>
                    {coursesForSemester.map((course) => (
                      <option key={`${course.semester}-${course.code}`} value={course.code}>
                        {course.code}
                      </option>
                    ))}
                  </select>
                  {errors.courseCode && (
                    <p id="courseCode-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.courseCode.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="courseTitle" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Course Title <span className="text-red-500" aria-label="required">*</span>
                    <span className="block sm:inline text-xs text-gray-500 sm:ml-2 mt-0.5 sm:mt-0">(Auto-filled from code)</span>
                  </label>
                  <select
                    id="courseTitle"
                    {...register('courseTitle', { required: 'Course Title is required' })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                    aria-invalid={errors.courseTitle ? 'true' : 'false'}
                    aria-describedby={errors.courseTitle ? 'courseTitle-error' : undefined}
                    disabled={isLoadingCourses || !semester}
                  >
                    <option value="">
                      {isLoadingCourses ? 'Loading courses...' : !semester ? 'Select semester first' : 'Select Course Title'}
                    </option>
                    {coursesForSemester.map((course) => (
                      <option key={`${course.semester}-${course.title}`} value={course.title}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  {errors.courseTitle && (
                    <p id="courseTitle-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.courseTitle.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="courseFaculty" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Course Faculty <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <select
                    id="courseFaculty"
                    {...register('courseFaculty', { required: 'Course Faculty is required' })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                    aria-invalid={errors.courseFaculty ? 'true' : 'false'}
                    aria-describedby={errors.courseFaculty ? 'courseFaculty-error' : undefined}
                    disabled={isLoadingFaculty}
                  >
                    <option value="">
                      {isLoadingFaculty ? 'Loading faculty...' : 'Select Faculty'}
                    </option>
                    {courseFaculty.length > 0
                      ? courseFaculty
                          .filter((faculty) => faculty && faculty.id && faculty.name)
                          .map((faculty) => (
                            <option key={faculty.id} value={faculty.name}>
                              {faculty.name}
                            </option>
                          ))
                      : !isLoadingFaculty && (
                          <option value="" disabled>
                            No faculty available
                          </option>
                        )}
                  </select>
                  {errors.courseFaculty && (
                    <p id="courseFaculty-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.courseFaculty.message}
                    </p>
                  )}
                  {courseFaculty.length === 0 && !isLoadingFaculty && (
                    <p className="text-yellow-600 text-xs mt-1">
                      No faculty found. Please check the database or refresh the page.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    {...register('date', { required: 'Date is required' })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                    aria-invalid={errors.date ? 'true' : 'false'}
                    aria-describedby={errors.date ? 'date-error' : undefined}
                  />
                  {errors.date && (
                    <p id="date-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="totalStudents" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Total Number of Students <span className="text-red-500" aria-label="required">*</span>
                    <span className="block sm:inline text-xs text-gray-500 sm:ml-2 mt-0.5 sm:mt-0">(Auto-filled from semester, editable)</span>
                  </label>
                  <input
                    id="totalStudents"
                    type="number"
                    {...register('totalStudents', {
                      required: 'Total Students is required',
                      min: { value: 1, message: 'Must be at least 1' },
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                    placeholder="e.g., 50"
                    aria-invalid={errors.totalStudents ? 'true' : 'false'}
                    aria-describedby={errors.totalStudents ? 'totalStudents-error' : undefined}
                  />
                  {errors.totalStudents && (
                    <p id="totalStudents-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.totalStudents.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Hour Table */}
            <section className="border-b pb-4 sm:pb-6" aria-labelledby="hour-table">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                <h2 id="hour-table" className="text-lg sm:text-xl font-semibold text-gray-700">
                  Hour Table (8 Hours)
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {isLoadingDayAttendance && (
                    <span className="text-xs sm:text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading saved sessions...
                    </span>
                  )}
                  {dayAttendanceId && dayAttendanceStatus === 'DRAFT' && (
                    <span className="text-xs sm:text-sm font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      Draft Mode - {savedSessions.size} session(s) saved
                    </span>
                  )}
                  {dayAttendanceStatus === 'FINALIZED' && (
                    <span className="text-xs sm:text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Finalized - Ready for Print
                    </span>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-[800px] sm:min-w-full border-collapse border border-gray-300" role="table" aria-label="Hour table">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[60px]">Hour</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Room</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Start</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">End</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[120px]">Course Code</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[150px]">Faculty</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Present</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Absent</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 8 }, (_, i) => {
                        const hourStart = watch(`hours.${i}.start`)
                        const hourData = watch(`hours.${i}`)
                        const isSaved = savedSessions.has(i)
                        const isSaving = savingSession === i
                        const isDisabled = dayAttendanceStatus === 'FINALIZED'
                        
                        return (
                          <tr key={i} className={isSaved ? 'bg-green-50' : ''}>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-center font-medium">{i + 1}</td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                {...register(`hours.${i}.room`)}
                                disabled={isDisabled}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="Room"
                                aria-label={`Room number for hour ${i + 1}`}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                type="time"
                                {...register(`hours.${i}.start`)}
                                disabled={isDisabled}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                aria-label={`Start time for hour ${i + 1}`}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                type="time"
                                {...register(`hours.${i}.end`, {
                                  validate: (value) => {
                                    if (!value || !hourStart) return true
                                    return validateTimeRange(hourStart, value) || 'End time must be after start time'
                                  }
                                })}
                                disabled={isDisabled}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                aria-label={`End time for hour ${i + 1}`}
                              />
                              {errors.hours?.[i]?.end && (
                                <p className="text-red-500 text-xs mt-0.5 block" role="alert">
                                  {errors.hours[i]?.end?.message}
                                </p>
                              )}
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              <select
                                {...register(`hours.${i}.courseCode`)}
                                disabled={isDisabled || isLoadingCourses || !semester}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                aria-label={`Course code for hour ${i + 1}`}
                              >
                                <option value="">Select</option>
                                {coursesForSemester.map((course) => (
                                  <option key={course.code} value={course.code}>
                                    {course.code}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              <select
                                {...register(`hours.${i}.courseFaculty`)}
                                disabled={isDisabled || isLoadingFaculty}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                aria-label={`Faculty for hour ${i + 1}`}
                              >
                                <option value="">Select</option>
                                {courseFaculty.map((faculty) => (
                                  <option key={faculty.id} value={faculty.id}>
                                    {faculty.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                type="number"
                                {...register(`hours.${i}.present`, {
                                  min: 0,
                                  max: totalStudents || 999,
                                  valueAsNumber: true,
                                })}
                                disabled={isDisabled}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="0"
                                aria-label={`Students present for hour ${i + 1}`}
                                onKeyDown={(e) => {
                                  // Prevent negative values with arrow keys
                                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                                    const currentValue = parseFloat((e.target as HTMLInputElement).value) || 0
                                    if (e.key === 'ArrowDown' && currentValue <= 0) {
                                      e.preventDefault()
                                    }
                                  }
                                }}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0
                                  const clampedValue = Math.max(0, Math.min(value, totalStudents || 999))
                                  if (value !== clampedValue) {
                                    e.target.value = clampedValue.toString()
                                    setValue(`hours.${i}.present`, clampedValue)
                                  }
                                }}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              <div className="text-xs text-gray-500 text-center">
                                {totalStudents > 0 && hourData.present !== undefined
                                  ? Math.max(0, totalStudents - (hourData.present || 0))
                                  : '-'}
                              </div>
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              {isSaved ? (
                                <span className="text-xs text-green-600 font-semibold flex items-center justify-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Saved
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSaveSession(i)}
                                  disabled={isDisabled || isSaving || !dayAttendanceId}
                                  className="w-full px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                  aria-label={`Save hour ${i + 1}`}
                                >
                                  {isSaving ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Save
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Add Row button - Note: Currently showing all 8 hours by default */}
              {dayAttendanceStatus === 'DRAFT' && dayAttendanceId && (
                <div className="mt-4 flex justify-end">
                  <div className="text-xs text-gray-500">
                    All 8 hours are available. Fill and save each session individually.
                  </div>
                </div>
              )}
            </section>

            {/* Section 3: Attendance Counts */}
            <section className="border-b pb-4 sm:pb-6" aria-labelledby="attendance-counts">
              <h2 id="attendance-counts" className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">
                Attendance Counts
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
                <div>
                  <label htmlFor="totalStudentsDisplay" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Total Students
                  </label>
                  <input
                    id="totalStudentsDisplay"
                    type="number"
                    value={totalStudents || ''}
                    readOnly
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base min-h-[44px]"
                    aria-label="Total students (read-only)"
                  />
                </div>

                <div>
                  <label htmlFor="present" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Number Present <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="present"
                    type="number"
                    {...register('present', {
                      required: 'Number Present is required',
                      min: { value: 0, message: 'Cannot be negative' },
                      max: { 
                        value: totalStudents || 999, 
                        message: 'Cannot exceed total students' 
                      },
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                    placeholder="0"
                    aria-invalid={errors.present ? 'true' : 'false'}
                    aria-describedby={errors.present ? 'present-error' : undefined}
                    onKeyDown={(e) => {
                      // Prevent negative values with arrow keys
                      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        const currentValue = parseFloat((e.target as HTMLInputElement).value) || 0
                        if (e.key === 'ArrowDown' && currentValue <= 0) {
                          e.preventDefault()
                        }
                      }
                    }}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      const clampedValue = Math.max(0, Math.min(value, totalStudents || 999))
                      if (value !== clampedValue) {
                        e.target.value = clampedValue.toString()
                        setValue('present', clampedValue)
                      }
                    }}
                  />
                  {errors.present && (
                    <p id="present-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.present.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="absent" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Number Absent
                  </label>
                  <input
                    id="absent"
                    type="number"
                    value={absent}
                    readOnly
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base min-h-[44px]"
                    aria-label="Number absent (auto-calculated, read-only)"
                  />
                </div>

                <div>
                  <label htmlFor="percentage" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Percentage Attendance
                  </label>
                  <input
                    id="percentage"
                    type="text"
                    value={`${percentage.toFixed(2)}%`}
                    readOnly
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base min-h-[44px]"
                    aria-label={`Attendance percentage: ${percentage.toFixed(2)}% (auto-calculated, read-only)`}
                  />
                </div>
              </div>
            </section>

            {/* Section 4: Signatures */}
            <section className="pb-4 sm:pb-6" aria-labelledby="signatures">
              <h2 id="signatures" className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">
                Signatures
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-sm text-gray-600 italic">
                  Note: HOD remarks can be added in the preview/print view after finalizing the day attendance.
                </p>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-base font-medium min-h-[44px]"
                  aria-label="Cancel and return to home"
                >
                  Cancel
                </button>
                {dayAttendanceId && dayAttendanceStatus === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={handleFinalizeDay}
                    disabled={isFinalizing || savedSessions.size === 0}
                    className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm sm:text-base min-h-[44px] flex items-center justify-center gap-2"
                    aria-label={isFinalizing ? 'Finalizing...' : 'Finalize Day Attendance'}
                  >
                    {isFinalizing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Finalizing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Finalize Day ({savedSessions.size} session{savedSessions.size !== 1 ? 's' : ''} saved)
                      </>
                    )}
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting || dayAttendanceStatus !== 'FINALIZED'}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base min-h-[44px] flex items-center justify-center gap-2"
                aria-label={isSubmitting ? 'Submitting form...' : dayAttendanceStatus === 'FINALIZED' ? 'Preview and Print Report' : 'Finalize day attendance first'}
              >
                {dayAttendanceStatus === 'FINALIZED' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Preview & Print
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Finalize to Print
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
