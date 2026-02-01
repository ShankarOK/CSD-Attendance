'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Modern Maintenance Mode Page
 * Displayed when MAINTENANCE_MODE=true
 * Features: Countdown timer, glassmorphism UI, animations
 */
export default function MaintenancePage() {
  const router = useRouter()
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    total: number
  } | null>(null)
  const [isBackOnline, setIsBackOnline] = useState(false)
  const [showAdminHint, setShowAdminHint] = useState(false)

  // Target date: 02/02/2026 09:00 AM IST (Asia/Kolkata)
  // Using ISO string with IST offset (+05:30)
  const targetDate = new Date('2026-02-02T09:00:00+05:30')

  useEffect(() => {
    function calculateTimeRemaining() {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        setIsBackOnline(true)
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: difference,
      })
    }

    // Calculate immediately
    calculateTimeRemaining()

    // Update every second
    const interval = setInterval(() => {
      calculateTimeRemaining()
    }, 1000)

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, [])

  // Auto-redirect when back online
  useEffect(() => {
    if (isBackOnline) {
      const redirectTimer = setTimeout(() => {
        router.push('/')
      }, 3000)

      return () => clearTimeout(redirectTimer)
    }
  }, [isBackOnline, router])

  // Auto-refresh when countdown hits 0
  useEffect(() => {
    if (timeRemaining?.total === 0 && !isBackOnline) {
      const refreshTimer = setTimeout(() => {
        window.location.reload()
      }, 1000)

      return () => clearTimeout(refreshTimer)
    }
  }, [timeRemaining?.total, isBackOnline])

  const formatTimeRemaining = () => {
    if (!timeRemaining) return 'Calculating...'

    const { days, hours, minutes, seconds } = timeRemaining

    // If less than 24 hours, show HH:mm:ss
    if (days === 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    // If more than 24 hours, show Xd Xh Xm Xs
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-40" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl opacity-40" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-40" />
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Card */}
        <div className="bg-card/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-border p-8 sm:p-12 relative overflow-hidden">
          {/* Shimmer Effect */}
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-primary/5 to-transparent" />

          {/* Content */}
          <div className="relative z-10">
            {/* Icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <svg 
                    className="w-12 h-12 sm:w-14 sm:h-14 text-white animate-pulse" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                </div>
                {/* Pulse Ring */}
                <div className="absolute inset-0 rounded-2xl bg-yellow-400/20 animate-ping"></div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4 text-center">
              🚧 Under Development
            </h1>

            {/* Message */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-center leading-relaxed">
              We're currently performing maintenance and improvements to serve you better.
            </p>

            {/* Countdown Timer */}
            {isBackOnline ? (
              <div className="mb-8">
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 sm:p-8 text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl sm:text-3xl font-bold text-green-700">
                      We are back online!
                    </h2>
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Redirecting you to the homepage...
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 sm:p-8">
                  <p className="text-sm sm:text-base text-blue-800 font-medium mb-4 text-center">
                    Expected downtime: We'll be back in
                  </p>
                  <div className="text-center">
                    <div className="inline-block bg-card rounded-xl px-6 py-4 shadow-lg border-2 border-border">
                      <div className="text-4xl sm:text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tabular-nums">
                        {formatTimeRemaining()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Institution Info */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-foreground text-center font-medium">
                PES Institute of Technology and Management, Shimoga
              </p>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Department of Computer Science and Design
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Page</span>
              </button>

              {/* Admin Hint */}
              <div className="relative">
                <button
                  onClick={() => setShowAdminHint(!showAdminHint)}
                  onMouseEnter={() => setShowAdminHint(true)}
                  onMouseLeave={() => setShowAdminHint(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-muted/50"
                  aria-label="Admin hint"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showAdminHint && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-card border border-border text-foreground text-xs rounded-lg p-3 shadow-xl z-20">
                    <p className="mb-1 font-semibold">Admin?</p>
                    <p className="text-muted-foreground">Use <code className="bg-muted px-1 py-0.5 rounded">/admin-bypass?key=...</code></p>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="w-2 h-2 bg-card border-l border-t border-border rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
