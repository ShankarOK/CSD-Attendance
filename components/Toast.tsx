'use client'

import { useEffect } from 'react'
import { CheckCircle2, XCircle, Info } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

/**
 * Toast notification — raises from bottom to stay below fixed navbar.
 * Theme-aware (light/dark) with semantic success/error/info styling.
 */
export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const styles = {
    success: {
      wrapper: 'bg-card border border-green-500/40 dark:border-green-400/40 shadow-lg shadow-green-500/10 dark:shadow-green-400/5',
      icon: 'text-green-600 dark:text-green-400',
      iconComponent: CheckCircle2,
    },
    error: {
      wrapper: 'bg-card border border-red-500/40 dark:border-red-400/40 shadow-lg shadow-red-500/10 dark:shadow-red-400/5',
      icon: 'text-red-600 dark:text-red-400',
      iconComponent: XCircle,
    },
    info: {
      wrapper: 'bg-card border border-primary/50 dark:border-primary/40 shadow-lg shadow-primary/10 dark:shadow-primary/5',
      icon: 'text-primary',
      iconComponent: Info,
    },
  }[type]

  const Icon = styles.iconComponent

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md ${styles.wrapper} px-4 py-3 rounded-lg z-50 animate-toast-raise flex items-center gap-3`}
      role="alert"
      aria-live="polite"
    >
      <Icon className={`h-5 w-5 shrink-0 ${styles.icon}`} aria-hidden />
      <p className="flex-1 min-w-0 text-sm font-medium text-foreground">{message}</p>
      <button
        onClick={onClose}
        className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  )
}

