'use client'

import { AttendanceReport } from '@/lib/types'
import {
  calculateAbsent,
  calculatePercentage,
  validateTimeRange
} from '@/lib/utils'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Info } from 'lucide-react'
import Toast from './Toast'
import { AppShell } from './AppShell'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

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
  const searchParams = useSearchParams()
  const urlDayAttendanceId = searchParams?.get('dayAttendanceId')
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
  const [editingSessions, setEditingSessions] = useState<Set<number>>(new Set()) // Which saved sessions are in edit mode
  const [savingSession, setSavingSession] = useState<number | null>(null) // Track which hour is being saved
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)
  const [finalizeCountdown, setFinalizeCountdown] = useState(5)

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
  
  // Check if all required header fields are filled
  const areHeadersComplete = Boolean(
    date && 
    semester && 
    academicYear && 
    classTeacher && 
    totalStudents && 
    totalStudents > 0
  )

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

  // Load day attendance from URL parameter if present
  useEffect(() => {
    let isCancelled = false
    
    async function loadDayAttendanceFromUrl() {
      if (!urlDayAttendanceId) {
        return // No URL parameter, use normal flow
      }

      try {
        setIsLoadingDayAttendance(true)
        const response = await fetch(`/api/attendance/day/${urlDayAttendanceId}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to load day attendance')
        }

        const data = await response.json()
        const { dayAttendance, sessions } = data
        
        if (!isCancelled) {
          // Set day attendance state
          setDayAttendanceId(dayAttendance.id)
          setDayAttendanceStatus(dayAttendance.status)
          
          // Populate form fields
          setValue('date', dayAttendance.date)
          setValue('semester', dayAttendance.semester.toString())
          setValue('academicYear', dayAttendance.academic_year)
          setValue('classTeacher', dayAttendance.classTeacherName)
          setValue('totalStudents', dayAttendance.total_students)
          setValue('program', dayAttendance.program)
          setValue('department', dayAttendance.department)
          
          // Load saved sessions into form
          const savedHours = new Set<number>()
          sessions.forEach((session: any) => {
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
          setEditingSessions(new Set())
          
          if (sessions.length > 0) {
            setToast({ 
              message: `Loaded ${sessions.length} saved session(s) from day attendance`, 
              type: 'success' 
            })
          } else if (dayAttendance.status === 'DRAFT') {
            setToast({ 
              message: 'Day attendance loaded. Start filling session details.', 
              type: 'info' 
            })
          }
          
          if (dayAttendance.status === 'FINALIZED') {
            setToast({ 
              message: 'This day attendance is finalized. You can view it but cannot edit.', 
              type: 'info' 
            })
          }
        }
      } catch (error: any) {
        console.error('Error loading day attendance from URL:', error)
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

    loadDayAttendanceFromUrl()
    
    return () => {
      isCancelled = true
    }
  }, [urlDayAttendanceId, setValue])

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
  // Skip this if we already loaded from URL parameter
  useEffect(() => {
    let isCancelled = false
    
    // Skip if we already have dayAttendanceId from URL
    if (urlDayAttendanceId) {
      return
    }
    
    async function loadDayAttendance() {
      // Wait for classTeacher and totalStudents to be populated from semester selection
      if (!date || !semester || !academicYear) {
        // Reset state if required fields are missing
        if (!isCancelled) {
          setDayAttendanceId(null)
          setDayAttendanceStatus(null)
          setSavedSessions(new Set())
          setEditingSessions(new Set())
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
          setEditingSessions(new Set())
          
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
  }, [date, semester, academicYear, classTeacher, totalStudents, urlDayAttendanceId, setValue])

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
      setEditingSessions(prev => {
        const next = new Set(prev)
        next.delete(hourIndex)
        return next
      })
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
      setToast({ message: 'Day attendance finalized successfully! Redirecting to preview...', type: 'success' })
      
      // Redirect to preview with dayAttendanceId to maintain state consistency
      setTimeout(() => {
        router.push(`/preview?dayAttendanceId=${dayAttendanceId}`)
      }, 1000)
    } catch (error: any) {
      console.error('Error finalizing day attendance:', error)
      setToast({ message: error.message || 'Failed to finalize day attendance', type: 'error' })
    } finally {
      setIsFinalizing(false)
    }
  }

  // Countdown for finalize confirmation (5 seconds)
  useEffect(() => {
    if (!showFinalizeConfirm) return
    setFinalizeCountdown(5)
    const t = setInterval(() => {
      setFinalizeCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(t)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [showFinalizeConfirm])

  const openFinalizeConfirm = () => {
    setShowFinalizeConfirm(true)
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
    // If day attendance is finalized, redirect to print preview with dayAttendanceId
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
    <AppShell>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Finalize confirmation modal — 5s countdown before user can continue */}
      {showFinalizeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="finalize-confirm-title">
          <Card className="w-full max-w-md border-2 border-border shadow-2xl p-6">
            <h2 id="finalize-confirm-title" className="text-lg font-semibold text-foreground mb-2">
              Finalize day attendance?
            </h2>
            <p className="text-muted-foreground mb-4">
              After finalizing, <strong className="text-foreground">no more sessions can be added or edited</strong>. You will only be able to view and print the report.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {finalizeCountdown > 0 ? (
                <>You can continue in <strong className="text-foreground tabular-nums">{finalizeCountdown}</strong> second{finalizeCountdown !== 1 ? 's' : ''}.</>
              ) : (
                <span className="text-green-600 dark:text-green-400 font-medium">You can continue now.</span>
              )}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFinalizeConfirm(false)}
                className="border-2"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={finalizeCountdown > 0}
                onClick={() => {
                  setShowFinalizeConfirm(false)
                  handleFinalizeDay()
                }}
                className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {finalizeCountdown > 0 ? `Continue in ${finalizeCountdown}s` : 'Continue anyway'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="mx-auto w-full max-w-4xl">
        <Card className="overflow-hidden border-2 shadow-card-hover p-4 sm:p-6 md:p-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
            Create Attendance Report
          </h1>
          <p className="text-center text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm">
            Fill in all required fields marked with <span className="text-destructive">*</span>
          </p>
          
          {/* Workflow Info Banner */}
          {dayAttendanceId && (
            <div className="mb-4 sm:mb-6 flex items-start gap-3 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">How it works</h3>
                <ol className="text-xs sm:text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Select date and semester to auto-load or create day attendance</li>
                  <li>Fill each hour row with course code, faculty, times, and attendance</li>
                  <li>Click &quot;Save&quot; on each row to save; header fields lock after first save</li>
                  <li>To change a saved session, click &quot;Edit&quot; then &quot;Update&quot;</li>
                  <li>Click &quot;Finalize Day&quot; when all sessions are complete</li>
                  <li>Preview and print the finalized attendance report</li>
                </ol>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6" noValidate>
            {/* Section 1: Header Details */}
            <section className="border-b pb-4 sm:pb-6" aria-labelledby="header-details">
              <h2 id="header-details" className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">
                Header Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full">
                <div>
                  <label htmlFor="program" className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    Program <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="program"
                    type="text"
                    value="Bachelor in Engineering"
                    readOnly
                    className="w-full px-3 py-2.5 sm:py-2 border border-border rounded-md bg-muted cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                    aria-label="Program (read-only): Bachelor in Engineering"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    Department <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="department"
                    type="text"
                    value="Computer Science and Design"
                    readOnly
                    className="w-full px-3 py-2.5 sm:py-2 border border-border rounded-md bg-muted cursor-not-allowed text-sm sm:text-base min-h-[44px]"
                    aria-label="Department (read-only): Computer Science and Design"
                  />
                </div>

                <div>
                  <label htmlFor="academicYear" className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    Academic Year <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="academicYear"
                    type="text"
                    {...register('academicYear', { required: 'Academic Year is required' })}
                    value={currentAcademicYear}
                    readOnly
                    disabled={isLoadingAcademicYear}
                    className="w-full px-3 py-2.5 sm:py-2 border border-border rounded-md bg-muted text-sm sm:text-base min-h-[44px] cursor-not-allowed"
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
                  <label htmlFor="semester" className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    Semester <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <select
                    id="semester"
                    {...register('semester', { required: 'Semester is required' })}
                    disabled={savedSessions.size > 0}
                    className={`w-full px-3 py-2.5 sm:py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-blue-500 text-sm sm:text-base min-h-[44px] ${savedSessions.size > 0 ? 'bg-muted cursor-not-allowed' : ''}`}
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
                  <label htmlFor="classTeacher" className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    Class Teacher <span className="text-red-500" aria-label="required">*</span>
                    <span className="block sm:inline text-xs text-muted-foreground sm:ml-2 mt-0.5 sm:mt-0">(Auto-selected based on semester)</span>
                  </label>
                  <input
                    id="classTeacher"
                    type="text"
                    {...register('classTeacher', { required: 'Class Teacher is required' })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-border rounded-md bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
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

                {/* Header-level course fields removed: course selection is per-session in the table below */}
                <div>
                  <label htmlFor="date" className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    Date <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    {...register('date', { required: 'Date is required' })}
                    disabled={savedSessions.size > 0}
                    className={`w-full px-3 py-2.5 sm:py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-blue-500 text-sm sm:text-base min-h-[44px] ${savedSessions.size > 0 ? 'bg-muted cursor-not-allowed' : ''}`}
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
                  <label htmlFor="totalStudents" className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                    Total Number of Students <span className="text-red-500" aria-label="required">*</span>
                    <span className="block sm:inline text-xs text-muted-foreground sm:ml-2 mt-0.5 sm:mt-0">(Auto-filled from semester{savedSessions.size > 0 ? ', locked after first session saved' : ', editable'})</span>
                  </label>
                  <input
                    id="totalStudents"
                    type="number"
                    {...register('totalStudents', {
                      required: 'Total Students is required',
                      min: { value: 1, message: 'Must be at least 1' },
                      valueAsNumber: true,
                    })}
                    disabled={savedSessions.size > 0}
                    className={`w-full px-3 py-2.5 sm:py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-blue-500 text-sm sm:text-base min-h-[44px] ${savedSessions.size > 0 ? 'bg-muted cursor-not-allowed' : ''}`}
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
                <h2 id="hour-table" className="text-lg sm:text-xl font-semibold text-foreground">
                  Hour Table (8 Hours)
                </h2>
                {!areHeadersComplete && (
                  <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded">
                    Please fill all header fields to enable hour table
                  </span>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {isLoadingDayAttendance && (
                    <span className="text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1.5 rounded-md flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full shrink-0" />
                      <Skeleton className="h-3 w-24" />
                    </span>
                  )}
                  {dayAttendanceId && dayAttendanceStatus === 'DRAFT' && (
                    <span className="text-xs sm:text-sm font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                      Draft Mode - {savedSessions.size} session(s) saved
                    </span>
                  )}
                  {dayAttendanceStatus === 'FINALIZED' && (
                    <span className="text-xs sm:text-sm font-semibold text-green-600 bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
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
                  <table className="min-w-[800px] sm:min-w-full border-collapse border border-border" role="table" aria-label="Hour table">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[60px]">Hour</th>
                        <th className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Room</th>
                        <th className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Start</th>
                        <th className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">End</th>
                        <th className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[120px]">Course Code</th>
                        <th className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[150px]">Faculty</th>
                        <th className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Present</th>
                        <th className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Absent</th>
                        <th className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 8 }, (_, i) => {
                        const hourStart = watch(`hours.${i}.start`)
                        const hourData = watch(`hours.${i}`)
                        const isSaved = savedSessions.has(i)
                        const isEditing = editingSessions.has(i)
                        const isSaving = savingSession === i
                        const isDisabled = dayAttendanceStatus === 'FINALIZED' || !areHeadersComplete || (isSaved && !isEditing)
                        
                        return (
                          <tr key={i} className={isSaved && !isEditing ? 'bg-primary/10' : ''}>
                            <td className="border border-border px-2 sm:px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-center font-medium">{i + 1}</td>
                            <td className="border border-border px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                {...register(`hours.${i}.room`)}
                                disabled={isDisabled}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-ring text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-muted cursor-not-allowed' : ''}`}
                                placeholder="Room"
                                aria-label={`Room number for hour ${i + 1}`}
                              />
                            </td>
                            <td className="border border-border px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                type="time"
                                {...register(`hours.${i}.start`)}
                                disabled={isDisabled}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-ring text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-muted cursor-not-allowed' : ''}`}
                                aria-label={`Start time for hour ${i + 1}`}
                              />
                            </td>
                            <td className="border border-border px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                type="time"
                                {...register(`hours.${i}.end`, {
                                  validate: (value) => {
                                    if (!value || !hourStart) return true
                                    return validateTimeRange(hourStart, value) || 'End time must be after start time'
                                  }
                                })}
                                disabled={isDisabled}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-ring text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-muted cursor-not-allowed' : ''}`}
                                aria-label={`End time for hour ${i + 1}`}
                              />
                              {errors.hours?.[i]?.end && (
                                <p className="text-red-500 text-xs mt-0.5 block" role="alert">
                                  {errors.hours[i]?.end?.message}
                                </p>
                              )}
                            </td>
                            <td className="border border-border px-2 sm:px-3 py-2.5 sm:py-2">
                              <select
                                {...register(`hours.${i}.courseCode`)}
                                disabled={isDisabled || isLoadingCourses || !semester}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-ring text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-muted cursor-not-allowed' : ''}`}
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
                            <td className="border border-border px-2 sm:px-3 py-2.5 sm:py-2">
                              <select
                                {...register(`hours.${i}.courseFaculty`)}
                                disabled={isDisabled || isLoadingFaculty}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-ring text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-muted cursor-not-allowed' : ''}`}
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
                            <td className="border border-border px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                type="number"
                                {...register(`hours.${i}.present`, {
                                  min: 0,
                                  max: totalStudents || 999,
                                  valueAsNumber: true,
                                })}
                                disabled={isDisabled}
                                className={`w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-ring text-xs sm:text-sm min-h-[36px] ${isDisabled ? 'bg-muted cursor-not-allowed' : ''}`}
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
                            <td className="border border-border px-2 sm:px-3 py-2.5 sm:py-2">
                              <div className="text-xs text-muted-foreground text-center">
                                {totalStudents > 0 && hourData.present !== undefined
                                  ? Math.max(0, totalStudents - (hourData.present || 0))
                                  : '-'}
                              </div>
                            </td>
                            <td className="border border-border px-2 sm:px-3 py-2.5 sm:py-2">
                              {isSaved && !isEditing ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingSessions(prev => new Set(prev).add(i))}
                                  disabled={dayAttendanceStatus === 'FINALIZED'}
                                  className="w-full px-2 py-1 text-xs font-medium text-primary border-2 border-primary rounded hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                  aria-label={`Edit hour ${i + 1}`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSaveSession(i)}
                                  disabled={isDisabled || isSaving || !dayAttendanceId}
                                  className="w-full px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                                  aria-label={isSaved ? `Update hour ${i + 1}` : `Save hour ${i + 1}`}
                                >
                                  {isSaving ? (
                                    <>
                                      <Skeleton className="h-3 w-3 rounded-full shrink-0 bg-foreground/20" />
                                      <Skeleton className="h-3 w-12 bg-foreground/20" />
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      {isSaved ? 'Update' : 'Save'}
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
                  <div className="text-xs text-muted-foreground">
                    All 8 hours are available. Fill and save each session individually.
                  </div>
                </div>
              )}
            </section>

            {/* Attendance Counts and Signatures sections removed - not needed in form */}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 border-2 border-border rounded-md text-foreground hover:bg-muted active:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base font-medium min-h-[44px]"
                  aria-label="Cancel and return to home"
                >
                  Cancel
                </button>
                {dayAttendanceId && dayAttendanceStatus === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={openFinalizeConfirm}
                    disabled={isFinalizing || savedSessions.size === 0}
                    className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 active:bg-green-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm sm:text-base min-h-[44px] flex items-center justify-center gap-2"
                    aria-label={isFinalizing ? 'Finalizing...' : 'Finalize Day Attendance'}
                  >
                    {isFinalizing ? (
                      <>
                        <Skeleton className="h-4 w-4 rounded-full shrink-0 bg-foreground/20" />
                        <Skeleton className="h-4 w-20 bg-foreground/20" />
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
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-sm sm:text-base min-h-[44px] flex items-center justify-center gap-2"
                aria-label={isSubmitting ? 'Submitting form...' : dayAttendanceStatus === 'FINALIZED' ? 'Preview and Print Report' : 'Finalize day attendance first'}
              >
                {isSubmitting ? (
                  <>
                    <Skeleton className="h-4 w-4 rounded-full shrink-0 bg-foreground/20" />
                    <Skeleton className="h-4 w-24 bg-foreground/20" />
                  </>
                ) : dayAttendanceStatus === 'FINALIZED' ? (
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
        </Card>
      </div>
    </AppShell>
  )
}
