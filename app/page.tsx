import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to Attendify - Day-Wise Attendance Report Management System for PES Institute of Technology and Management, Shimoga - Department of Computer Science and Design. Access attendance forms and admin dashboard.',
  openGraph: {
    title: 'Attendify - Day-Wise Attendance Report Management System',
    description: 'Digital attendance report management system for PES Institute of Technology and Management, Shimoga - Department of Computer Science and Design.',
    url: '/',
  },
}

export default function Home() {
  return <HomePageClient />
}
