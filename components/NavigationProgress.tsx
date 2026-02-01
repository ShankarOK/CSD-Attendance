'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

/**
 * Thin progress bar at the top of the viewport that shows during route changes.
 * Gives instant feedback when navigating (Next.js 16 + smooth UX).
 * Only runs on navigation, not on initial mount.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    setVisible(true)
    setProgress(20)
    const t1 = requestAnimationFrame(() => {
      setProgress(70)
    })
    const t2 = setTimeout(() => {
      setProgress(100)
    }, 150)
    const t3 = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 320)
    return () => {
      cancelAnimationFrame(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [pathname])

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-primary/90 shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
      style={{
        transform: `scaleX(${progress / 100})`,
        transformOrigin: 'left',
        transition: progress <= 20 ? 'none' : 'transform 0.2s ease-out',
      }}
    />
  )
}
