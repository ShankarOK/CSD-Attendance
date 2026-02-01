'use client'

import { useEffect, useState } from 'react'
import { NavBar } from '@/components/NavBar'
import { PageTransition } from '@/components/PageTransition'
import { NavigationProgress } from '@/components/NavigationProgress'
import { SkipToContent } from '@/components/SkipToContent'

/**
 * Persistent app chrome: navbar stays fixed, only page content transitions.
 * Fetches currentUser once and passes to NavBar so nav never remounts on route change.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setCurrentUser({ username: data.user.username, role: data.user.role })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    }
  }

  return (
    <>
      <SkipToContent />
      <NavBar currentUser={currentUser} onLogout={handleLogout} />
      <NavigationProgress />
      <PageTransition>{children}</PageTransition>
    </>
  )
}
