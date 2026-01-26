'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Toast from './Toast'

interface Teacher {
  id: number
  name: string
}

interface Course {
  id: number
  semester: number
  course_name: string
  course_code: string
}

interface Semester {
  id: number
  semester: number
  class_teacher: string
  total_students: number
}

type Tab = 'teachers' | 'courses' | 'semesters' | 'academic-year'

// Skeleton Components
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
      <div className="animate-pulse">
        <div className="h-12 bg-gradient-to-r from-gray-50 to-gray-100"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 border-b border-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                <div className="h-4 w-48 bg-gray-200 rounded"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
                <div className="h-8 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-gray-100 animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-4">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="flex gap-2 mt-6">
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

function CourseCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('teachers')
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  // Loading states for each section
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingSemesters, setLoadingSemesters] = useState(false)
  const [loadingAcademicYear, setLoadingAcademicYear] = useState(false)

  // Teachers state
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [showTeacherForm, setShowTeacherForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)

  // Courses state
  const [courses, setCourses] = useState<Course[]>([])
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all')

  // Semesters state
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([])

  // Academic Year state
  const [academicYear, setAcademicYear] = useState('')

  // Set mounted to true after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/admin/login')
          return
        }
        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  // Load data based on active tab
  useEffect(() => {
    if (!user) return

    if (activeTab === 'teachers') {
      loadTeachers()
    } else if (activeTab === 'courses') {
      loadCourses()
    } else if (activeTab === 'semesters') {
      loadSemesters()
      loadTeachers() // For dropdown
    } else if (activeTab === 'academic-year') {
      loadAcademicYear()
    }
  }, [activeTab, user])

  const loadTeachers = async () => {
    setLoadingTeachers(true)
    try {
      const response = await fetch('/api/admin/teachers')
      if (response.ok) {
        const data = await response.json()
        setTeachers(data)
        setAvailableTeachers(data)
      }
    } catch (error) {
      console.error('Error loading teachers:', error)
    } finally {
      setLoadingTeachers(false)
    }
  }

  const loadCourses = async () => {
    setLoadingCourses(true)
    try {
      const response = await fetch('/api/admin/courses')
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoadingCourses(false)
    }
  }

  const loadSemesters = async () => {
    setLoadingSemesters(true)
    try {
      const response = await fetch('/api/admin/semesters')
      if (response.ok) {
        const data = await response.json()
        setSemesters(data)
      }
    } catch (error) {
      console.error('Error loading semesters:', error)
    } finally {
      setLoadingSemesters(false)
    }
  }

  const loadAcademicYear = async () => {
    setLoadingAcademicYear(true)
    try {
      const response = await fetch('/api/admin/academic-year')
      if (response.ok) {
        const data = await response.json()
        setAcademicYear(data.current_academic_year || '')
      }
    } catch (error) {
      console.error('Error loading academic year:', error)
    } finally {
      setLoadingAcademicYear(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Group courses by semester
  const groupedCourses = courses.reduce((acc, course) => {
    if (!acc[course.semester]) {
      acc[course.semester] = []
    }
    acc[course.semester].push(course)
    return acc
  }, {} as Record<number, Course[]>)

  const filteredCourses = selectedSemester === 'all' 
    ? courses 
    : courses.filter(c => c.semester === selectedSemester)

  const availableSemesters = Array.from(new Set(courses.map(c => c.semester))).sort((a, b) => a - b)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 font-medium text-lg">Loading Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-white hover:text-indigo-200 transition-all transform hover:scale-110 flex-shrink-0 p-2 rounded-lg hover:bg-white/10"
                title="Back to Home"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin Dashboard
                </h1>
                <p className="text-sm sm:text-base text-indigo-100 mt-1">PESITM, Shimoga - CSD Department</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4">
              {mounted && user && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg backdrop-blur-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-white font-medium truncate max-w-[120px] sm:max-w-none">Welcome, {user.username}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <nav className="flex space-x-1 p-1 overflow-x-auto">
            {(['teachers', 'courses', 'semesters', 'academic-year'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 whitespace-nowrap flex items-center gap-2`}
              >
                {tab === 'teachers' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {tab === 'courses' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
                {tab === 'semesters' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {tab === 'academic-year' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="capitalize">{tab.replace('-', ' ')}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'teachers' && (
            <TeachersManagement
              teachers={teachers}
              loading={loadingTeachers}
              onRefresh={loadTeachers}
              onToast={setToast}
            />
          )}
          {activeTab === 'courses' && (
            <CoursesManagement
              courses={courses}
              filteredCourses={filteredCourses}
              groupedCourses={groupedCourses}
              availableSemesters={availableSemesters}
              selectedSemester={selectedSemester}
              onSemesterChange={setSelectedSemester}
              loading={loadingCourses}
              onRefresh={loadCourses}
              onToast={setToast}
            />
          )}
          {activeTab === 'semesters' && (
            <SemestersManagement
              semesters={semesters}
              teachers={availableTeachers}
              loading={loadingSemesters}
              onRefresh={loadSemesters}
              onToast={setToast}
            />
          )}
          {activeTab === 'academic-year' && (
            <AcademicYearManagement
              academicYear={academicYear}
              loading={loadingAcademicYear}
              onRefresh={loadAcademicYear}
              onToast={setToast}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Teachers Management Component
function TeachersManagement({
  teachers,
  loading,
  onRefresh,
  onToast,
}: {
  teachers: Teacher[]
  loading: boolean
  onRefresh: () => void
  onToast: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState({
    name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editing
        ? `/api/admin/teachers/${editing.id}`
        : '/api/admin/teachers'
      const method = editing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        onToast({ message: error.error || 'Operation failed', type: 'error' })
        return
      }

      onToast({
        message: editing ? 'Teacher updated successfully' : 'Teacher created successfully',
        type: 'success',
      })
      setShowForm(false)
      setEditing(null)
      setFormData({ name: '' })
      onRefresh()
    } catch (error) {
      onToast({ message: 'An error occurred', type: 'error' })
    }
  }

  const handleEdit = (teacher: Teacher) => {
    setEditing(teacher)
    setFormData({
      name: teacher.name,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return

    try {
      const response = await fetch(`/api/admin/teachers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        onToast({ message: error.error || 'Delete failed', type: 'error' })
        return
      }

      onToast({ message: 'Teacher deleted successfully', type: 'success' })
      onRefresh()
    } catch (error) {
      onToast({ message: 'An error occurred', type: 'error' })
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            Manage Teachers
          </h2>
          <p className="text-sm text-gray-500 ml-14">Add, edit, or remove faculty members</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditing(null)
            setFormData({ name: '' })
          }}
          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Teacher
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-gray-100 mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {editing ? 'Edit Teacher' : 'Add New Teacher'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-base"
                placeholder="Enter teacher name"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Note: All teachers can be class teachers and course faculty
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {editing ? 'Update Teacher' : 'Create Teacher'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-gray-100 rounded-full mb-4">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-semibold text-lg">No teachers found</p>
                      <p className="text-sm text-gray-400 mt-1">Add your first teacher to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {teacher.name.charAt(0)}
                        </div>
                        <span className="text-base font-semibold text-gray-900">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Courses Management Component with Semester Filtering
function CoursesManagement({
  courses,
  filteredCourses,
  groupedCourses,
  availableSemesters,
  selectedSemester,
  onSemesterChange,
  loading,
  onRefresh,
  onToast,
}: {
  courses: Course[]
  filteredCourses: Course[]
  groupedCourses: Record<number, Course[]>
  availableSemesters: number[]
  selectedSemester: number | 'all'
  onSemesterChange: (semester: number | 'all') => void
  loading: boolean
  onRefresh: () => void
  onToast: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')
  const [formData, setFormData] = useState({
    semester: '',
    courseName: '',
    courseCode: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editing
        ? `/api/admin/courses/${editing.id}`
        : '/api/admin/courses'
      const method = editing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester: parseInt(formData.semester),
          courseName: formData.courseName,
          courseCode: formData.courseCode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        onToast({ message: error.error || 'Operation failed', type: 'error' })
        return
      }

      onToast({
        message: editing ? 'Course updated successfully' : 'Course created successfully',
        type: 'success',
      })
      setShowForm(false)
      setEditing(null)
      setFormData({ semester: '', courseName: '', courseCode: '' })
      onRefresh()
    } catch (error) {
      onToast({ message: 'An error occurred', type: 'error' })
    }
  }

  const handleEdit = (course: Course) => {
    setEditing(course)
    setFormData({
      semester: course.semester.toString(),
      courseName: course.course_name,
      courseCode: course.course_code,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      const response = await fetch(`/api/admin/courses/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        onToast({ message: error.error || 'Delete failed', type: 'error' })
        return
      }

      onToast({ message: 'Course deleted successfully', type: 'success' })
      onRefresh()
    } catch (error) {
      onToast({ message: 'An error occurred', type: 'error' })
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              Manage Courses
            </h2>
            <p className="text-sm text-gray-500 ml-14">Add, edit, or remove course information</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setEditing(null)
              setFormData({ semester: '', courseName: '', courseCode: '' })
            }}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Course
          </button>
        </div>

        {/* Semester Filter and View Mode Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Filter by Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => onSemesterChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium text-sm"
            >
              <option value="all">All Semesters</option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              ({filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'})
            </span>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Table
            </button>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-gray-100 mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {editing ? 'Edit Course' : 'Add New Course'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Semester *
              </label>
              <select
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num}{num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'} Semester
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course Name *
              </label>
              <input
                type="text"
                required
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="e.g., Data Structures and Algorithms"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-mono"
                placeholder="e.g., CS201"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {editing ? 'Update Course' : 'Create Course'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-16 text-center">
          <div className="p-4 bg-gray-100 rounded-full inline-block mb-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-600 font-semibold text-lg">No courses found</p>
          <p className="text-sm text-gray-400 mt-1">
            {selectedSemester === 'all' 
              ? 'Add your first course to get started'
              : `No courses found for ${selectedSemester}${selectedSemester === 1 ? 'st' : selectedSemester === 2 ? 'nd' : selectedSemester === 3 ? 'rd' : 'th'} semester`}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        // Card View - Grouped by Semester
        <div className="space-y-8">
          {selectedSemester === 'all' ? (
            // Show all semesters grouped
            Object.entries(groupedCourses)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([semester, semesterCourses]) => (
                <div key={semester} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    <h3 className="text-xl font-bold text-gray-900 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                      {semester}{semester === '1' ? 'st' : semester === '2' ? 'nd' : semester === '3' ? 'rd' : 'th'} Semester
                      <span className="ml-2 text-sm font-normal text-gray-600">({semesterCourses.length} {semesterCourses.length === 1 ? 'course' : 'courses'})</span>
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {semesterCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                            {course.semester}{course.semester === 1 ? 'st' : course.semester === 2 ? 'nd' : course.semester === 3 ? 'rd' : 'th'} Sem
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(course)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(course.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-lg text-gray-900 mb-2">{course.course_code}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{course.course_name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          ) : (
            // Show only selected semester
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                      {course.semester}{course.semester === 1 ? 'st' : course.semester === 2 ? 'nd' : course.semester === 3 ? 'rd' : 'th'} Sem
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-lg text-gray-900 mb-2">{course.course_code}</div>
                  <div className="text-sm text-gray-600 line-clamp-2">{course.course_name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Table View
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Course Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Course Name
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800">
                      {course.semester}{course.semester === 1 ? 'st' : course.semester === 2 ? 'nd' : course.semester === 3 ? 'rd' : 'th'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900">
                    {course.course_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {course.course_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Semesters Management Component
function SemestersManagement({
  semesters,
  teachers,
  loading,
  onRefresh,
  onToast,
}: {
  semesters: Semester[]
  teachers: Teacher[]
  loading: boolean
  onRefresh: () => void
  onToast: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void
}) {
  const [editing, setEditing] = useState<Semester | null>(null)
  const [formData, setFormData] = useState({
    classTeacher: '',
    totalStudents: '',
  })

  const handleEdit = (semester: Semester) => {
    setEditing(semester)
    setFormData({
      classTeacher: semester.class_teacher,
      totalStudents: semester.total_students.toString(),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return

    try {
      const response = await fetch('/api/admin/semesters', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester: editing.semester,
          classTeacher: formData.classTeacher,
          totalStudents: parseInt(formData.totalStudents),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        onToast({ message: error.error || 'Update failed', type: 'error' })
        return
      }

      onToast({ message: 'Semester updated successfully', type: 'success' })
      setEditing(null)
      onRefresh()
    } catch (error) {
      onToast({ message: 'An error occurred', type: 'error' })
    }
  }

  // All teachers can be class teachers
  const classTeachers = teachers

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          Manage Semesters
        </h2>
        <p className="text-sm text-gray-500 ml-14">Configure class teachers and student counts for each semester</p>
      </div>
      
      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Class Teacher
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Students
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {semesters.map((semester) => (
                <tr key={semester.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
                      {semester.semester}{semester.semester === 1 ? 'st' : semester.semester === 2 ? 'nd' : semester.semester === 3 ? 'rd' : 'th'} Semester
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editing?.id === semester.id ? (
                      <select
                        value={formData.classTeacher}
                        onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                        className="w-full sm:w-auto px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                      >
                        <option value="">Select Teacher</option>
                        {classTeachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.name}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium">{semester.class_teacher || 'Not assigned'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editing?.id === semester.id ? (
                      <input
                        type="number"
                        min="1"
                        value={formData.totalStudents}
                        onChange={(e) => setFormData({ ...formData, totalStudents: e.target.value })}
                        className="w-28 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm"
                      />
                    ) : (
                      <span className="font-semibold">{semester.total_students}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editing?.id === semester.id ? (
                      <div className="flex flex-col sm:flex-row justify-end gap-2">
                        <button
                          onClick={handleSubmit}
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(semester)}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Academic Year Management Component
function AcademicYearManagement({
  academicYear,
  loading,
  onRefresh,
  onToast,
}: {
  academicYear: string
  loading: boolean
  onRefresh: () => void
  onToast: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void
}) {
  const [year, setYear] = useState(academicYear)

  useEffect(() => {
    setYear(academicYear)
  }, [academicYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/academic-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAcademicYear: year }),
      })

      if (!response.ok) {
        const error = await response.json()
        onToast({ message: error.error || 'Update failed', type: 'error' })
        return
      }

      onToast({ message: 'Academic year updated successfully', type: 'success' })
      onRefresh()
    } catch (error) {
      onToast({ message: 'An error occurred', type: 'error' })
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          Manage Academic Year
        </h2>
        <p className="text-sm text-gray-500 ml-14">Set the current academic year for attendance reports</p>
      </div>
      
      {loading ? (
        <CardSkeleton />
      ) : (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Academic Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2025-26"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-lg font-medium"
              />
              <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Format: YYYY-YY (e.g., 2025-26)
              </p>
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 font-bold text-base transform hover:-translate-y-0.5"
            >
              Save Academic Year
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
