'use client'

import { AttendanceReport } from '@/lib/types'
import {
  calculateAbsent,
  calculatePercentage,
  getAcademicYearOptions,
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
    },
  })

  const totalStudents = watch('totalStudents') || 0
  const present = watch('present') || 0
  const semester = watch('semester')

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
      } finally {
        setIsLoadingCourses(false)
      }
    }
    fetchCourses()
  }, [])

  // Fetch course faculty from database on mount
  useEffect(() => {
    async function fetchFaculty() {
      try {
        setIsLoadingFaculty(true)
        const response = await fetch('/api/teachers?role=course_faculty')
        if (!response.ok) {
          throw new Error('Failed to fetch faculty')
        }
        const faculty = await response.json()
        setCourseFaculty(faculty)
      } catch (error) {
        console.error('Error fetching faculty:', error)
      } finally {
        setIsLoadingFaculty(false)
      }
    }
    fetchFaculty()
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
        } catch (error) {
          console.error('Error fetching semester data:', error)
        }
      }
    }
    fetchSemesterData()
  }, [semester, setValue])
  
  // Get academic year options
  const academicYearOptions = getAcademicYearOptions()

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
    setIsSubmitting(true)
    
    try {
      // Validate calculations and ensure fixed values
      const validatedData: AttendanceReport = {
        ...data,
        program: 'Bachelor in Engineering',
        department: 'Computer Science and Design',
        absent: calculateAbsent(data.totalStudents, data.present),
        percentage: calculatePercentage(data.totalStudents, data.present),
      }

      // Store in sessionStorage for preview page
      sessionStorage.setItem('attendanceReport', JSON.stringify(validatedData))
      
      setToast({ message: 'Report created successfully! Redirecting...', type: 'success' })
      
      // Small delay to show success message
      setTimeout(() => {
        router.push('/preview')
      }, 500)
    } catch (error) {
      console.error('Error submitting form:', error)
      setToast({ message: 'Failed to create report. Please try again.', type: 'error' })
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
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
                  <select
                    id="academicYear"
                    {...register('academicYear', { required: 'Academic Year is required' })}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base min-h-[44px]"
                    aria-invalid={errors.academicYear ? 'true' : 'false'}
                    aria-describedby={errors.academicYear ? 'academicYear-error' : undefined}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.academicYear && (
                    <p id="academicYear-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.academicYear.message}
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
                    {courseFaculty.map((faculty) => (
                      <option key={faculty.id} value={faculty.name}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                  {errors.courseFaculty && (
                    <p id="courseFaculty-error" className="text-red-500 text-xs mt-1" role="alert">
                      {errors.courseFaculty.message}
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
              <h2 id="hour-table" className="text-lg sm:text-xl font-semibold text-gray-700 mb-3 sm:mb-4">
                Hour Table (8 Hours)
              </h2>
              <div className="overflow-x-auto -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-[600px] sm:min-w-full border-collapse border border-gray-300" role="table" aria-label="Hour table">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[60px]">Hour No.</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[100px]">Room No.</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[120px]">Start Time</th>
                        <th className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-left text-xs sm:text-sm font-semibold whitespace-nowrap min-w-[120px]">End Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 8 }, (_, i) => {
                        const hourStart = watch(`hours.${i}.start`)
                        return (
                          <tr key={i}>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2 text-xs sm:text-sm text-center font-medium">{i + 1}</td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                {...register(`hours.${i}.room`)}
                                className="w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[36px]"
                                placeholder="Room"
                                aria-label={`Room number for hour ${i + 1}`}
                              />
                            </td>
                            <td className="border border-gray-300 px-2 sm:px-3 py-2.5 sm:py-2">
                              <input
                                type="time"
                                {...register(`hours.${i}.start`)}
                                className="w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[36px]"
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
                                className="w-full px-2 py-2 sm:py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs sm:text-sm min-h-[36px]"
                                aria-label={`End time for hour ${i + 1}`}
                              />
                            {errors.hours?.[i]?.end && (
                              <p className="text-red-500 text-xs mt-0.5 block" role="alert">
                                {errors.hours[i]?.end?.message}
                              </p>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
              </div>
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
                <div>
                  <label htmlFor="remarks" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Remarks by HOD
                  </label>
                  <textarea
                    id="remarks"
                    {...register('remarks')}
                    rows={4}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-y min-h-[100px]"
                    placeholder="Enter remarks..."
                    aria-label="Remarks by Head of Department"
                  />
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-base font-medium min-h-[44px]"
                aria-label="Cancel and return to home"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base min-h-[44px]"
                aria-label={isSubmitting ? 'Submitting form...' : 'Submit and preview report'}
              >
                {isSubmitting ? 'Submitting...' : 'Preview Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
