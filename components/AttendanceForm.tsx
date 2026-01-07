'use client'

import { AttendanceReport } from '@/lib/types'
import {
  calculateAbsent,
  calculatePercentage,
  COURSES,
  FACULTY,
  getAcademicYearOptions,
  getClassTeacherBySemester,
  getCourseByCode,
  getCourseByTitle,
  getTotalStudentsBySemester,
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
export default function AttendanceForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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
  const courseCode = watch('courseCode')
  const courseTitle = watch('courseTitle')
  
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Create Attendance Report
          </h1>
          <p className="text-center text-gray-600 mb-6 text-sm">
            Fill in all required fields marked with <span className="text-red-500">*</span>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* Section 1: Header Details */}
            <section className="border-b pb-6" aria-labelledby="header-details">
              <h2 id="header-details" className="text-xl font-semibold text-gray-700 mb-4">
                Header Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">
                    Program <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="program"
                    type="text"
                    value="Bachelor in Engineering"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    aria-label="Program (read-only): Bachelor in Engineering"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="department"
                    type="text"
                    value="Computer Science and Design"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                    aria-label="Department (read-only): Computer Science and Design"
                  />
                </div>

                <div>
                  <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <select
                    id="academicYear"
                    {...register('academicYear', { required: 'Academic Year is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
                    Semester <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <select
                    id="semester"
                    {...register('semester', { required: 'Semester is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label htmlFor="classTeacher" className="block text-sm font-medium text-gray-700 mb-1">
                    Class Teacher <span className="text-red-500" aria-label="required">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Auto-selected based on semester)</span>
                  </label>
                  <input
                    id="classTeacher"
                    type="text"
                    {...register('classTeacher', { required: 'Class Teacher is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Course Code <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <select
                    id="courseCode"
                    {...register('courseCode', { required: 'Course Code is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-invalid={errors.courseCode ? 'true' : 'false'}
                    aria-describedby={errors.courseCode ? 'courseCode-error' : undefined}
                  >
                    <option value="">Select Course Code</option>
                    {COURSES.map((course) => (
                      <option key={course.code} value={course.code}>
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
                  <label htmlFor="courseTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title <span className="text-red-500" aria-label="required">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Auto-filled from code)</span>
                  </label>
                  <select
                    id="courseTitle"
                    {...register('courseTitle', { required: 'Course Title is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-invalid={errors.courseTitle ? 'true' : 'false'}
                    aria-describedby={errors.courseTitle ? 'courseTitle-error' : undefined}
                  >
                    <option value="">Select Course Title</option>
                    {COURSES.map((course) => (
                      <option key={course.title} value={course.title}>
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
                  <label htmlFor="courseFaculty" className="block text-sm font-medium text-gray-700 mb-1">
                    Course Faculty <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <select
                    id="courseFaculty"
                    {...register('courseFaculty', { required: 'Course Faculty is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-invalid={errors.courseFaculty ? 'true' : 'false'}
                    aria-describedby={errors.courseFaculty ? 'courseFaculty-error' : undefined}
                  >
                    <option value="">Select Faculty</option>
                    {FACULTY.map((faculty) => (
                      <option key={faculty} value={faculty}>
                        {faculty}
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
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500" aria-label="required">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    {...register('date', { required: 'Date is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label htmlFor="totalStudents" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Number of Students <span className="text-red-500" aria-label="required">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Auto-filled from semester, editable)</span>
                  </label>
                  <input
                    id="totalStudents"
                    type="number"
                    {...register('totalStudents', {
                      required: 'Total Students is required',
                      min: { value: 1, message: 'Must be at least 1' },
                      valueAsNumber: true,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <section className="border-b pb-6" aria-labelledby="hour-table">
              <h2 id="hour-table" className="text-xl font-semibold text-gray-700 mb-4">
                Hour Table (8 Hours)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300" role="table" aria-label="Hour table">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Hour No.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Room No.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Start Time</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">End Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 8 }, (_, i) => {
                      const hourStart = watch(`hours.${i}.start`)
                      return (
                        <tr key={i}>
                          <td className="border border-gray-300 px-3 py-2 text-sm text-center">{i + 1}</td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              {...register(`hours.${i}.room`)}
                              className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Room"
                              aria-label={`Room number for hour ${i + 1}`}
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="time"
                              {...register(`hours.${i}.start`)}
                              className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              aria-label={`Start time for hour ${i + 1}`}
                            />
                          </td>
                          <td className="border border-gray-300 px-3 py-2">
                            <input
                              type="time"
                              {...register(`hours.${i}.end`, {
                                validate: (value) => {
                                  if (!value || !hourStart) return true
                                  return validateTimeRange(hourStart, value) || 'End time must be after start time'
                                }
                              })}
                              className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              aria-label={`End time for hour ${i + 1}`}
                            />
                            {errors.hours?.[i]?.end && (
                              <p className="text-red-500 text-xs mt-0.5" role="alert">
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
            </section>

            {/* Section 3: Attendance Counts */}
            <section className="border-b pb-6" aria-labelledby="attendance-counts">
              <h2 id="attendance-counts" className="text-xl font-semibold text-gray-700 mb-4">
                Attendance Counts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="totalStudentsDisplay" className="block text-sm font-medium text-gray-700 mb-1">
                    Total Students
                  </label>
                  <input
                    id="totalStudentsDisplay"
                    type="number"
                    value={totalStudents || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    aria-label="Total students (read-only)"
                  />
                </div>

                <div>
                  <label htmlFor="present" className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label htmlFor="absent" className="block text-sm font-medium text-gray-700 mb-1">
                    Number Absent
                  </label>
                  <input
                    id="absent"
                    type="number"
                    value={absent}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    aria-label="Number absent (auto-calculated, read-only)"
                  />
                </div>

                <div>
                  <label htmlFor="percentage" className="block text-sm font-medium text-gray-700 mb-1">
                    Percentage Attendance
                  </label>
                  <input
                    id="percentage"
                    type="text"
                    value={`${percentage.toFixed(2)}%`}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    aria-label={`Attendance percentage: ${percentage.toFixed(2)}% (auto-calculated, read-only)`}
                  />
                </div>
              </div>
            </section>

            {/* Section 4: Signatures */}
            <section className="pb-6" aria-labelledby="signatures">
              <h2 id="signatures" className="text-xl font-semibold text-gray-700 mb-4">
                Signatures
              </h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks by HOD
                  </label>
                  <textarea
                    id="remarks"
                    {...register('remarks')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter remarks..."
                    aria-label="Remarks by Head of Department"
                  />
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                aria-label="Cancel and return to home"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
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
