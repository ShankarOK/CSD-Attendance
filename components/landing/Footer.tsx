'use client'

import { ClipboardList } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 bg-muted/20 py-10">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <span className="font-display font-semibold text-foreground">Attendify</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {year} Attendify • Built for PESITM • Department of CSD
          </p>
        </div>
      </div>
    </footer>
  )
}
