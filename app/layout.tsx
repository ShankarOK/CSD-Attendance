import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Attendify - Day-Wise Attendance Report',
  description: 'Digital attendance report form for colleges',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}

