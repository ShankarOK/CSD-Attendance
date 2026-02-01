'use client'

import Link from 'next/link'

/**
 * Skip link for keyboard/screen reader users. Visible on focus for a11y.
 */
export function SkipToContent() {
  return (
    <Link
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </Link>
  )
}
