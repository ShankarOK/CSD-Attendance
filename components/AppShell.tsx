'use client'

/**
 * Content wrapper for form, admin, preview. NavBar is in AppChrome (root layout).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-6xl px-3 sm:px-6 py-4 sm:py-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
