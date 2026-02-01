'use client'

import { AttendanceReport } from '@/lib/types'
import {
    formatDateAcademic,
    formatTimeAcademic,
    getDayName
} from '@/lib/utils'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useReactToPrint } from 'react-to-print'
import Toast from './Toast'
import { AppShell } from './AppShell'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

/**
 * Read-Only Attendance Preview Component
 * Displays finalized attendance data for printing
 * Only HOD remarks can be edited
 */
export default function AttendancePreview() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dayAttendanceIdParam = searchParams?.get('dayAttendanceId')
  
  const componentRef = useRef<HTMLFormElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const printOrientation: 'landscape' = 'landscape' // Always landscape
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('')
  const [isLoadingAcademicYear, setIsLoadingAcademicYear] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isLoadingFinalizedData, setIsLoadingFinalizedData] = useState(false)
  const [loadedSessions, setLoadedSessions] = useState<any[]>([])

  const { 
    register, 
    watch, 
    setValue,
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
  const semester = watch('semester')
  const date = watch('date')
  const hours = watch('hours')

  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load finalized attendance data if dayAttendanceId is provided
  useEffect(() => {
    async function loadFinalizedData() {
      const id = dayAttendanceIdParam ? parseInt(dayAttendanceIdParam, 10) : NaN
      if (!dayAttendanceIdParam || isNaN(id) || id < 1) {
        // No or invalid dayAttendanceId - redirect to form
        setToast({ message: 'Invalid or missing attendance ID. Please start from the form.', type: 'error' })
        router.push('/form')
        return
      }

      try {
        setIsLoadingFinalizedData(true)
        const response = await fetch(`/api/attendance/day/${id}/print`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const message = errorData.error || 'Failed to load finalized attendance data'
          if (response.status === 403) {
            setToast({ message: 'This report is not finalized yet.', type: 'error' })
            router.push('/form')
            setIsLoadingFinalizedData(false)
            return
          }
          // Invalid ID, not found, or other API error - show message and redirect
          setToast({ message, type: 'error' })
          setTimeout(() => router.push('/form'), 2000)
          setIsLoadingFinalizedData(false)
          return
        }

        const data = await response.json()
        const { dayAttendance, sessions } = data

        // Store sessions for display
        setLoadedSessions(sessions)

        // Populate form with finalized data
        setValue('date', dayAttendance.date)
        setValue('semester', dayAttendance.semester.toString())
        setValue('academicYear', dayAttendance.academic_year)
        setValue('classTeacher', dayAttendance.classTeacherName)
        setValue('totalStudents', dayAttendance.total_students)
        setValue('program', dayAttendance.program)
        setValue('department', dayAttendance.department)

        // Populate hours with session data (read-only display)
        const hoursData = Array.from({ length: 8 }, (_, i) => {
          const session = sessions.find((s: any) => s.hour_no === i + 1)
          return {
            hour: i + 1,
            room: session?.room_no || '',
            start: session?.start_time?.substring(0, 5) || '', // Convert HH:MM:SS to HH:MM
            end: session?.end_time?.substring(0, 5) || '',
            courseCode: session?.course_code || '',
            courseFaculty: session?.facultyName || '', // Use name for display
            present: session?.students_present || 0,
          }
        })

        setValue('hours', hoursData)
        
        setToast({ 
          message: `Finalized attendance data loaded (${sessions.length} session${sessions.length !== 1 ? 's' : ''})`, 
          type: 'success' 
        })
      } catch (error: any) {
        console.error('Error loading finalized data:', error)
        setToast({ 
          message: error.message || 'Failed to load finalized attendance data', 
          type: 'error' 
        })
        // Redirect to form on error
        setTimeout(() => {
          router.push('/form')
        }, 2000)
      } finally {
        setIsLoadingFinalizedData(false)
      }
    }

    loadFinalizedData()
  }, [dayAttendanceIdParam, setValue, router])

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

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
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
    handlePrint()
  }

  // Ctrl+P / Cmd+P: use same print flow as the Print button (react-to-print)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        const canPrint = !isLoadingFinalizedData && loadedSessions.length > 0 && !isPrinting
        if (canPrint) {
          e.preventDefault()
          handlePrint()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isLoadingFinalizedData, loadedSessions.length, isPrinting])

  // Format date with day name
  const formattedDate = date 
    ? `${formatDateAcademic(date)} (${getDayName(date)})`
    : ''

  return (
    <AppShell>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-6xl mx-auto">
        {/* Header Section - No Print */}
        <div className="mb-4 sm:mb-8 no-print">
          <div className="rounded-xl sm:rounded-2xl border border-border bg-card shadow-card p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                  Attendance Report - Print View
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  PES Institute of Technology and Management, Shimoga - Department of Computer Science and Design
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  This is a read-only view. Only HOD remarks can be edited.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <Button
                  type="button"
                  onClick={handlePrintClick}
                  disabled={isPrinting || isLoadingFinalizedData || loadedSessions.length === 0}
                  size="lg"
                  className="gap-2 shadow-glow-sm hover:shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
                  aria-label={isPrinting ? 'Printing...' : isLoadingFinalizedData || loadedSessions.length === 0 ? 'Loading report...' : 'Print report'}
                >
                  {isPrinting ? (
                    <>
                      <span className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary-foreground/30 animate-pulse shrink-0 block" />
                      <span className="h-4 w-16 sm:w-20 bg-primary-foreground/30 rounded animate-pulse block" />
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>Print</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* During load: skeleton; after load: printable content */}
        {isLoadingFinalizedData ? (
          <div className="bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden shadow-2xl no-print" aria-busy="true" aria-label="Loading report">
            <div className="p-4 sm:p-6 border-b border-border">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <div className="p-4 sm:p-6 border-b border-border">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={`skeleton-info-${i}`} className="h-9 w-full" />
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-6 overflow-x-auto">
              <Skeleton className="h-10 w-full mb-2" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={`skeleton-row-${i}`} className="h-12 w-full mb-1 last:mb-0" />
              ))}
            </div>
          </div>
        ) : (
        <>
        <form 
          ref={componentRef} 
          className={`bg-card print-container print-centered print-${printOrientation} shadow-2xl rounded-xl sm:rounded-2xl border border-border overflow-hidden no-print-shadow`}
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

          {/* General Information - Read-Only */}
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
                <input
                  type="text"
                  value={semester ? `${semester}${semester === '1' ? 'st' : semester === '2' ? 'nd' : semester === '3' ? 'rd' : 'th'}` : ''}
                  readOnly
                  className="print-field-input print-field-readonly"
                />
              </div>
              <div className="print-info-item">
                <span className="print-label">Date:</span>
                <input
                  type="text"
                  value={mounted && date ? formattedDate : ''}
                  readOnly
                  className="print-field-input print-field-readonly"
                />
              </div>
              <div className="print-info-item">
                <span className="print-label">Class Teacher:</span>
                <input
                  type="text"
                  value={watch('classTeacher') || ''}
                  readOnly
                  className="print-field-input print-field-readonly"
                />
              </div>
              <div className="print-info-item">
                <span className="print-label">Total No. of Students:</span>
                <input
                  type="text"
                  value={totalStudents || ''}
                  readOnly
                  className="print-field-input print-field-readonly"
                />
              </div>
            </div>
          </div>

          {/* Hour Table - Read-Only */}
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
                {loadedSessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="print-td text-center text-muted-foreground">
                      No session data available
                    </td>
                  </tr>
                ) : (
                  loadedSessions
                    .sort((a: any, b: any) => a.hour_no - b.hour_no)
                    .map((session: any) => {
                      const i = session.hour_no - 1
                      const hourData = hours?.[i]
                      const hourPresent = Math.max(0, hourData?.present || 0)
                      const hourAbsent = totalStudents > 0 
                        ? Math.min(Math.max(0, totalStudents - hourPresent), totalStudents)
                        : 0
                      
                      return (
                        <tr key={i}>
                          <td className="print-td print-td-center">{session.hour_no}</td>
                          <td className="print-td">
                            <span className="print-field-display">{hourData?.room || ''}</span>
                          </td>
                          <td className="print-td">
                            <span className="print-field-display">
                              {hourData?.start ? formatTimeAcademic(hourData.start) : ''}
                            </span>
                          </td>
                          <td className="print-td">
                            <span className="print-field-display">
                              {hourData?.end ? formatTimeAcademic(hourData.end) : ''}
                            </span>
                          </td>
                          <td className="print-td">
                            <span className="print-field-display">{hourData?.courseCode || ''}</span>
                          </td>
                          <td className="print-td">
                            <span className="print-field-display">{hourData?.courseFaculty || ''}</span>
                          </td>
                          <td className="print-td print-td-center">
                            <span className="print-field-display">{hourPresent}</span>
                          </td>
                          <td className="print-td print-td-center">
                            <span className="print-field-display">{hourAbsent}</span>
                          </td>
                          <td className="print-td">
                            <span className="print-field-display"></span>
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer - Day Average Attendance & HOD Remarks */}
          <div className="print-footer">
            {/* Day Average Attendance - Auto-calculated, Read-only */}
            <div className="print-summary mb-4">
              <div className="print-summary-grid">
                <div className="print-summary-item">
                  <span className="print-label">Day Average Attendance:</span>
                  <input
                    type="text"
                    value={(() => {
                      if (loadedSessions.length === 0 || totalStudents === 0) return 'N/A'
                      const totalPresent = loadedSessions.reduce((sum: number, session: any) => {
                        const hourData = hours?.[session.hour_no - 1]
                        return sum + (hourData?.present || 0)
                      }, 0)
                      const averagePresent = (totalPresent / loadedSessions.length).toFixed(2)
                      const averagePercentage = totalStudents > 0 
                        ? ((parseFloat(averagePresent) / totalStudents) * 100).toFixed(2)
                        : '0.00'
                      return `${averagePresent} / ${totalStudents} (${averagePercentage}%)`
                    })()}
                    readOnly
                    className="print-field-input print-field-readonly"
                  />
                </div>
              </div>
            </div>
            
            <div className="print-remarks">
              <p className="print-label">Remarks by the HOD:</p>
              <textarea
                {...register('remarks')}
                className="print-remarks-box print-field-textarea"
                rows={2}
                placeholder="Enter HOD remarks here..."
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
        </>
        )}
      </div>
    </AppShell>
  )
}
