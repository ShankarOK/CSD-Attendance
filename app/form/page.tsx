import AttendanceForm from '@/components/AttendanceForm'
import type { Metadata } from 'next'

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
  return <AttendanceForm />
}
