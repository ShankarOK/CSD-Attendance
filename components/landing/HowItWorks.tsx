'use client'

import { BookOpen, ClipboardCheck, FileOutput } from 'lucide-react'

const steps = [
  {
    number: '1',
    title: 'Choose Course',
    description: 'Select semester, date, and course. Day attendance loads or is created in one click.',
    icon: BookOpen,
  },
  {
    number: '2',
    title: 'Mark Attendance',
    description: 'Fill hour-wise sessions with faculty, times, and present count. Save per row, validate on the fly.',
    icon: ClipboardCheck,
  },
  {
    number: '3',
    title: 'Export / Manage Reports',
    description: 'Finalize the day and open preview. Print or save as PDF. Admins can browse archives anytime.',
    icon: FileOutput,
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Three steps to clean attendance
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            From course selection to export—no spreadsheets, no chaos.
          </p>
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.number} className="relative">
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-primary/50 to-transparent sm:block" aria-hidden />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-primary bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="mt-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
