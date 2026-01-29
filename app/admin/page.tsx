import AdminDashboard from '@/components/AdminDashboard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Administrative dashboard for managing faculty, courses, semesters, and academic year settings for PES Institute of Technology and Management, Shimoga - Department of Computer Science and Design.',
  robots: {
    index: false, // Don't index admin pages
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
}

export default async function AdminPage() {
  return <AdminDashboard />
}

