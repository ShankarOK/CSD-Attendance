import AttendanceForm from '@/components/AttendanceForm'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Attendance Form - Create Daily Attendance',
  description: 'Create and manage day-wise attendance reports. Fill out session details, save individually, and finalize for printing.',
  robots: {
    index: false,
    follow: true,
  },
}

/**
 * Attendance Form Page
 * Main form for creating daily attendance reports
 */
export default function FormPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AttendanceForm />
    </Suspense>
  )
}
