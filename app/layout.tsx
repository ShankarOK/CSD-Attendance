import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Attendify - Day-Wise Attendance Report Management System',
    template: '%s | Attendify - PESITM Shimoga'
  },
  description: 'Digital attendance report management system for PES Institute of Technology and Management, Shimoga - Department of Computer Science and Design. Create, manage, and print professional day-wise attendance reports.',
  keywords: ['attendance', 'attendance report', 'college attendance', 'PESITM', 'Shimoga', 'Computer Science', 'attendance management', 'digital attendance'],
  authors: [{ name: 'PESITM Shimoga - CSD Department' }],
  creator: 'PES Institute of Technology and Management, Shimoga',
  publisher: 'PES Institute of Technology and Management, Shimoga',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Attendify - PESITM Shimoga',
    title: 'Attendify - Day-Wise Attendance Report Management System',
    description: 'Digital attendance report management system for PES Institute of Technology and Management, Shimoga - Department of Computer Science and Design.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Attendify - Day-Wise Attendance Report Management System',
    description: 'Digital attendance report management system for PES Institute of Technology and Management, Shimoga.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification if needed
    // google: 'your-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

