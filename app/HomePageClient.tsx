'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList,
  LayoutDashboard,
  Zap,
  BarChart3,
  Shield,
  BookOpen,
  FileCheck,
  FileOutput,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function HomePageClient() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (mounted) router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero — fluid container, wide layout; text blocks have own max-width for readability */}
      <section className="relative z-10 container py-12 sm:py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-8 lg:gap-10 xl:gap-12 items-center">
          <motion.div
            className="min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full mb-4">
              PESITM • CSD Department
            </span>
            <h1 className="max-w-3xl text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground leading-tight mb-4">
              Attendance, streamlined for{' '}
              <span className="text-primary">modern classrooms.</span>
            </h1>
            <p className="max-w-2xl text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
              Mark attendance in seconds, manage courses effortlessly, and export clean reports with zero chaos.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <Link href="/form">
                <Button size="lg" className="gap-2 shadow-glow-sm hover:shadow-glow">
                  <ClipboardList className="h-5 w-5" />
                  Mark Attendance
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={handleAdminClick}
                disabled={!mounted}
              >
                <LayoutDashboard className="h-5 w-5" />
                Open Admin Dashboard
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Fast • Secure • Export-ready</p>
          </motion.div>

          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          >
            <div className="w-full max-w-md lg:max-w-lg rounded-xl border border-border bg-card p-6 sm:p-8 shadow-card hover:shadow-card-hover transition-shadow">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Today&apos;s overview
              </p>
              <div className="space-y-3 border-b border-border pb-3">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Today&apos;s Attendance</span>
                  <span className="font-semibold text-foreground">52/60</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[86%] rounded-full bg-primary" />
                </div>
              </div>
              <div className="flex justify-between text-sm sm:text-base py-2 border-b border-border">
                <span className="text-muted-foreground">Active Courses</span>
                <span className="font-semibold text-foreground">4</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base py-2 border-b border-border">
                <span className="text-muted-foreground">Late Entries</span>
                <span className="font-semibold text-foreground">2</span>
              </div>
              <div className="flex items-end gap-1.5 h-14 mt-4">
                {[72, 85, 68, 90, 78, 88, 82].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-[10px] rounded-t bg-primary/20"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <Button variant="secondary" size="sm" className="w-full mt-5">
                Export Report
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features — fluid container */}
      <section className="relative z-10 container py-12 sm:py-16">
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-2"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
        >
          Why Attendify?
        </motion.h2>
        <motion.p
          className="text-center text-muted-foreground mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Built for real faculty and real classrooms.
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: Zap, title: 'One-click attendance', desc: 'Mark and save sessions in seconds, no spreadsheets.' },
            { icon: BarChart3, title: 'Admin insights', desc: 'Dashboard with courses, semesters, and reports at a glance.' },
            { icon: Shield, title: 'Role-based access', desc: 'Secure access control for faculty and admins.' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-card-hover hover:border-border/80 transition-all"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works — fluid container */}
      <section className="relative z-10 container py-12 sm:py-16">
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-2"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
        >
          How it works
        </motion.h2>
        <motion.p
          className="text-center text-muted-foreground mb-10 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Three steps from course to report.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
          {[
            { icon: BookOpen, title: 'Select course', desc: 'Choose semester, date, and course. Day attendance loads or is created in one click.' },
            { icon: FileCheck, title: 'Mark attendance', desc: 'Fill hour-wise sessions with faculty, times, and present count. Save per row.' },
            { icon: FileOutput, title: 'Export report', desc: 'Finalize the day, preview, and print or save as PDF. Admins browse archives anytime.' },
          ].map((s, i) => (
            <motion.div
              key={s.title}
              className="relative text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="flex justify-center mb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl border border-border bg-card flex items-center justify-center text-primary mx-auto mb-3">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer — fluid container */}
      <footer className="relative z-10 border-t border-border mt-12">
        <div className="container py-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Attendify</span> © {new Date().getFullYear()} • Built for PESITM CSD
          </p>
        </div>
      </footer>
    </div>
  )
}
