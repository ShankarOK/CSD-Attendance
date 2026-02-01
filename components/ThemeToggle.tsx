'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Minimal circular sun/moon toggle for light/dark mode.
 * Hidden when printing (no-print).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <span
        className={cn(
          'no-print inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50',
          className
        )}
        aria-hidden
      >
        <span className="h-4 w-4" />
      </span>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      className={cn(
        'no-print inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        'text-muted-foreground hover:text-foreground hover:bg-muted/80',
        'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
        className
      )}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
