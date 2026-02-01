'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Toast from './Toast'
import { AppShell } from './AppShell'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { DashboardSkeleton } from '@/components/skeletons'
import { cn } from '@/lib/utils'

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

type Tab = 'teachers' | 'courses' | 'semesters' | 'settings' | 'archives' | 'sessions'

interface ArchiveRecord {
  id: number
  date: string
  semester: number
  academic_year: string
  class_teacher_name: string
  total_students: number
  status: 'DRAFT' | 'FINALIZED'
}

// Skeleton Components (design tokens for theme consistency)
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
      <div className="animate-pulse">
        <div className="h-12 bg-muted/80 border-b border-border" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 border-b border-border last:border-0">
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="h-4 w-32 sm:w-48 bg-muted rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-muted rounded-md" />
                <div className="h-8 w-16 bg-muted rounded-md" />
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
    <div className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-card animate-pulse">
      <div className="h-6 w-48 bg-muted rounded mb-4" />
      <div className="space-y-4">
        <div className="h-12 bg-muted rounded" />
        <div className="h-12 bg-muted rounded" />
        <div className="h-12 bg-muted rounded" />
        <div className="flex gap-2 mt-6">
          <div className="h-10 w-24 bg-muted rounded" />
          <div className="h-10 w-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  )
}

function CourseCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-4" />
      <div className="space-y-3">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('teachers')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
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

  // Sessions state (admin)
  const [sessions, setSessions] = useState<Array<{ id: string; username: string; role: string; createdAt: string; userAgent: string | null }>>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  // Archives state
  const [archives, setArchives] = useState<ArchiveRecord[]>([])
  const [loadingArchives, setLoadingArchives] = useState(false)
  const [archivesFilters, setArchivesFilters] = useState({ dateFrom: '', dateTo: '', semester: '' })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'teachers') {
      loadTeachers()
    } else if (activeTab === 'courses') {
      loadCourses()
    } else if (activeTab === 'semesters') {
      loadSemesters()
      loadTeachers()
    } else if (activeTab === 'settings') {
      loadAcademicYear()
    } else if (activeTab === 'archives') {
      loadArchives()
    } else if (activeTab === 'sessions') {
      loadSessions()
    }
  }, [activeTab])

  const loadArchives = async (override?: { dateFrom: string; dateTo: string; semester: string }) => {
    setLoadingArchives(true)
    const f = override ?? archivesFilters
    try {
      const q = new URLSearchParams()
      if (f.dateFrom) q.set('dateFrom', f.dateFrom)
      if (f.dateTo) q.set('dateTo', f.dateTo)
      if (f.semester) q.set('semester', f.semester)
      const res = await fetch(`/api/admin/archives?${q.toString()}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setArchives(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingArchives(false)
    }
  }

  const loadSessions = async () => {
    setLoadingSessions(true)
    try {
      const res = await fetch('/api/admin/sessions', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingSessions(false)
    }
  }

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId)
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, { method: 'DELETE' })
      if (res.ok) {
        setToast({ message: 'Session revoked. User will be logged out on next request.', type: 'success' })
        loadSessions()
      } else {
        const data = await res.json().catch(() => ({}))
        setToast({ message: data.error || 'Failed to revoke', type: 'error' })
      }
    } catch (e) {
      setToast({ message: 'Failed to revoke session', type: 'error' })
    } finally {
      setRevokingId(null)
    }
  }

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
      const response = await fetch(`/api/admin/semesters?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
      })
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
    return <DashboardSkeleton />
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
      <div className="mx-auto w-full max-w-7xl">
        <Card className="overflow-hidden border-2 shadow-card-hover mb-6">
          <nav className="flex gap-1 p-2 overflow-x-auto">
            {(['teachers', 'courses', 'semesters', 'settings', 'archives', 'sessions'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 sm:px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 whitespace-nowrap flex items-center gap-2',
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground shadow-glow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
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
                {tab === 'settings' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
                {tab === 'archives' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                )}
                {tab === 'sessions' && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                <span className="capitalize">{tab === 'settings' ? 'Settings' : tab === 'archives' ? 'Archives' : tab.replace('-', ' ')}</span>
              </button>
            ))}
          </nav>
        </Card>

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
          {activeTab === 'settings' && (
            <SettingsManagement
              academicYear={academicYear}
              loadingAcademicYear={loadingAcademicYear}
              onRefreshAcademicYear={loadAcademicYear}
              onToast={setToast}
            />
          )}
          {activeTab === 'archives' && (
            <ArchivesManagement
              archives={archives}
              loading={loadingArchives}
              filters={archivesFilters}
              onFiltersChange={setArchivesFilters}
              onSearch={loadArchives}
              onToast={setToast}
            />
          )}
          {activeTab === 'sessions' && (
            <SessionsManagement
              sessions={sessions}
              loading={loadingSessions}
              onRefresh={loadSessions}
              onRevoke={handleRevokeSession}
              revokingId={revokingId}
              onToast={setToast}
            />
          )}
        </div>
      </div>
    </AppShell>
  )
}

// Archives Management: list attendance reports, view/print
function ArchivesManagement({
  archives,
  loading,
  filters,
  onFiltersChange,
  onSearch,
  onToast,
}: {
  archives: ArchiveRecord[]
  loading: boolean
  filters: { dateFrom: string; dateTo: string; semester: string }
  onFiltersChange: (f: { dateFrom: string; dateTo: string; semester: string }) => void
  onSearch: (f: { dateFrom: string; dateTo: string; semester: string }) => void
  onToast: (t: { message: string; type: 'success' | 'error' | 'info' }) => void
}) {
  const handleSearch = () => onSearch(filters)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          Archives
        </h2>
        <p className="text-sm text-muted-foreground ml-14">View, download or print attendance reports by day and semester</p>
      </div>

      <div className="bg-card p-4 rounded-xl shadow-lg border border-border mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Filter</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Date from</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Date to</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Semester</label>
            <select
              value={filters.semester}
              onChange={(e) => onFiltersChange({ ...filters, semester: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm min-w-[120px]"
            >
              <option value="">All</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>{s}{s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-semibold"
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {archives.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No attendance reports found. Adjust filters or add reports from the form.</div>
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Academic Year</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Class Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Students</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {archives.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/70 dark:hover:bg-muted/60">
                      <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{row.semester}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{row.academic_year}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{row.class_teacher_name}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{row.total_students}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${row.status === 'FINALIZED' ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/preview?dayAttendanceId=${row.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg mr-1"
                        >
                          View
                        </Link>
                        {row.status === 'FINALIZED' ? (
                          <a
                            href={`/preview?dayAttendanceId=${row.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80 dark:hover:bg-muted/70 rounded-lg border border-border"
                          >
                            Print / Download
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-muted-foreground cursor-not-allowed" title="Finalize the report first">
                            Print / Download
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Sessions Management (admin only)
function SessionsManagement({
  sessions,
  loading,
  onRefresh,
  onRevoke,
  revokingId,
  onToast,
}: {
  sessions: Array<{ id: string; username: string; role: string; createdAt: string; userAgent: string | null }>
  loading: boolean
  onRefresh: () => void
  onRevoke: (id: string) => void
  revokingId: string | null
  onToast: (t: { message: string; type: 'success' | 'error' | 'info' }) => void
}) {
  const formatDate = (d: string) => {
    try {
      const date = new Date(d)
      return date.toLocaleString()
    } catch {
      return d
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
        <div className="animate-pulse p-6 space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
      <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground">Active Sessions</h3>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No active sessions.</div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">User Agent</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-muted/70 dark:hover:bg-muted/60">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{s.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{s.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatDate(s.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate hidden md:table-cell" title={s.userAgent || undefined}>{s.userAgent || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={() => onRevoke(s.id)}
                      disabled={revokingId === s.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 dark:hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {revokingId === s.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            Manage Teachers
          </h2>
          <p className="text-sm text-muted-foreground ml-14">Add, edit, or remove faculty members</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setEditing(null)
            setFormData({ name: '' })
          }}
          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Teacher
        </button>
      </div>

      {showForm && (
        <div className="bg-card p-6 md:p-8 rounded-xl shadow-xl border border-border mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {editing ? 'Edit Teacher' : 'Add New Teacher'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-base"
                placeholder="Enter teacher name"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Note: All teachers can be class teachers and course faculty
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {editing ? 'Update Teacher' : 'Create Teacher'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 dark:hover:bg-muted/80 font-semibold transition-all"
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
        <div className="bg-card shadow-xl rounded-xl overflow-hidden border border-border overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gradient-to-r bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-muted rounded-full mb-4">
                        <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <p className="text-muted-foreground font-semibold text-lg">No teachers found</p>
                      <p className="text-sm text-muted-foreground mt-1">Add your first teacher to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-muted/70 dark:hover:bg-muted/60 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br bg-primary flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {teacher.name.charAt(0)}
                        </div>
                        <span className="text-base font-semibold text-foreground">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="px-4 py-2 bg-red-500/15 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/25 dark:hover:bg-red-500/30 transition-all font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
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
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              Manage Courses
            </h2>
            <p className="text-sm text-muted-foreground ml-14">Add, edit, or remove course information</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setEditing(null)
              setFormData({ semester: '', courseName: '', courseCode: '' })
            }}
            className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-emerald-500 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Course
          </button>
        </div>

        {/* Semester Filter and View Mode Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg shadow-md border border-border">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-foreground">Filter by Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => onSemesterChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-4 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all font-medium text-sm"
            >
              <option value="all">All Semesters</option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}{sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester
                </option>
              ))}
            </select>
            <span className="text-sm text-muted-foreground">
              ({filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'})
            </span>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-card text-green-600 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
                  ? 'bg-card text-green-600 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
        <div className="bg-card p-6 md:p-8 rounded-xl shadow-xl border border-border mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {editing ? 'Edit Course' : 'Add New Course'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Semester *
              </label>
              <select
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
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
              <label className="block text-sm font-semibold text-foreground mb-2">
                Course Name *
              </label>
              <input
                type="text"
                required
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                placeholder="e.g., Data Structures and Algorithms"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all font-mono"
                placeholder="e.g., CS201"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-500 dark:hover:to-emerald-500 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {editing ? 'Update Course' : 'Create Course'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 dark:hover:bg-muted/80 font-semibold transition-all"
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
        <div className="bg-card rounded-xl shadow-lg border border-border p-16 text-center">
          <div className="p-4 bg-muted rounded-full inline-block mb-4">
            <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-muted-foreground font-semibold text-lg">No courses found</p>
          <p className="text-sm text-muted-foreground mt-1">
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
                    <h3 className="text-xl font-bold text-foreground px-4 py-2 bg-gradient-to-r bg-primary/10 rounded-lg">
                      {semester}{semester === '1' ? 'st' : semester === '2' ? 'nd' : semester === '3' ? 'rd' : 'th'} Semester
                      <span className="ml-2 text-sm font-normal text-muted-foreground">({semesterCourses.length} {semesterCourses.length === 1 ? 'course' : 'courses'})</span>
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {semesterCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-card rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r bg-primary/10 text-primary">
                            {course.semester}{course.semester === 1 ? 'st' : course.semester === 2 ? 'nd' : course.semester === 3 ? 'rd' : 'th'} Sem
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(course)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded transition-all"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(course.id)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/15 dark:hover:bg-red-500/20 rounded transition-all"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-lg text-foreground mb-2">{course.course_code}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">{course.course_name}</div>
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
                  className="bg-card rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-all transform hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r bg-primary/10 text-primary">
                      {course.semester}{course.semester === 1 ? 'st' : course.semester === 2 ? 'nd' : course.semester === 3 ? 'rd' : 'th'} Sem
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-500/15 dark:hover:bg-red-500/20 rounded transition-all"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-lg text-foreground mb-2">{course.course_code}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">{course.course_name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Table View
        <div className="bg-card shadow-xl rounded-xl overflow-hidden border border-border overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gradient-to-r bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                  Course Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                  Course Name
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-muted/50 dark:hover:bg-muted/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r bg-primary/10 text-primary">
                      {course.semester}{course.semester === 1 ? 'st' : course.semester === 2 ? 'nd' : course.semester === 3 ? 'rd' : 'th'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-foreground">
                    {course.course_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {course.course_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(course)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="px-4 py-2 bg-red-500/15 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/25 dark:hover:bg-red-500/30 transition-all font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
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
      // Refetch so UI shows latest data (await to avoid stale cache)
      await (onRefresh as () => Promise<void>)()
    } catch (error) {
      onToast({ message: 'An error occurred', type: 'error' })
    }
  }

  // All teachers can be class teachers
  const classTeachers = teachers

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          Manage Semesters
        </h2>
        <p className="text-sm text-muted-foreground ml-14">Configure class teachers and student counts for each semester</p>
      </div>
      
      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="bg-card shadow-xl rounded-xl overflow-hidden border border-border overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gradient-to-r bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                  Class Teacher
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                  Total Students
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {semesters.map((semester) => (
                <tr key={semester.id} className="hover:bg-muted/50 dark:hover:bg-muted/60 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary/10 text-primary dark:text-primary">
                      {semester.semester}{semester.semester === 1 ? 'st' : semester.semester === 2 ? 'nd' : semester.semester === 3 ? 'rd' : 'th'} Semester
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {editing?.id === semester.id ? (
                      <select
                        value={formData.classTeacher}
                        onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                        className="w-full sm:w-auto px-3 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-sm"
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {editing?.id === semester.id ? (
                      <input
                        type="number"
                        min="1"
                        value={formData.totalStudents}
                        onChange={(e) => setFormData({ ...formData, totalStudents: e.target.value })}
                        className="w-28 px-3 py-2 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-sm"
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
                          className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 dark:hover:bg-muted/80 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(semester)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
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

// Settings tab: Academic Year + Change Password
function SettingsManagement({
  academicYear,
  loadingAcademicYear,
  onRefreshAcademicYear,
  onToast,
}: {
  academicYear: string
  loadingAcademicYear: boolean
  onRefreshAcademicYear: () => void
  onToast: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void
}) {
  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          Settings
        </h2>
        <p className="text-sm text-muted-foreground ml-14">Academic year and account settings</p>
      </div>

      {/* Academic Year subsection */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="inline-block w-1 h-6 bg-orange-500 rounded-full" />
          Academic year
        </h3>
        <AcademicYearManagement
          academicYear={academicYear}
          loading={loadingAcademicYear}
          onRefresh={onRefreshAcademicYear}
          onToast={onToast}
        />
      </div>

      {/* Change Password subsection */}
      <ChangePasswordSection onToast={onToast} />
    </div>
  )
}

// Change Password form (logged-in only; optional revoke other sessions)
function ChangePasswordSection({
  onToast,
}: {
  onToast: (toast: { message: string; type: 'success' | 'error' | 'info' }) => void
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      onToast({ message: 'New password must be at least 6 characters', type: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      onToast({ message: 'New password and confirmation do not match', type: 'error' })
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        onToast({ message: data.error || 'Failed to change password', type: 'error' })
        setIsSubmitting(false)
        return
      }
      onToast({
        message: revokeOtherSessions
          ? 'Password changed. All other sessions have been revoked.'
          : 'Password changed successfully.',
        type: 'success',
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setRevokeOtherSessions(false)
    } catch {
      onToast({ message: 'Failed to change password', type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <span className="inline-block w-1 h-6 bg-primary rounded-full" />
        Change password
      </h3>
      <div className="bg-card p-6 md:p-8 rounded-xl shadow-xl border border-border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="Enter current password"
              required
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
              placeholder="Confirm new password"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={isSubmitting}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={revokeOtherSessions}
              onChange={(e) => setRevokeOtherSessions(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm font-medium text-foreground">
              Revoke all other sessions when I change my password (log out other devices)
            </span>
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {isSubmitting ? 'Updating…' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Academic Year subsection (used inside Settings)
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
      {loading ? (
        <CardSkeleton />
      ) : (
        <div className="bg-card p-6 md:p-8 rounded-xl shadow-xl border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Current Academic Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2025-26"
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all text-lg font-medium"
              />
              <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
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
