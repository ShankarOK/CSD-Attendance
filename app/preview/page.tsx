import AttendancePreview from '@/components/AttendancePreview'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Attendance Form',
  description: 'Create and manage day-wise attendance reports. Fill out the form, preview, and print professional attendance documents for PES Institute of Technology and Management, Shimoga.',
  robots: {
    index: false, // Don't index the form page
    follow: true,
  },
}

/**
 * Preview Page Component
 * Now serves as the main editable document interface
 */
export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AttendancePreview />
    </Suspense>
  )
}
