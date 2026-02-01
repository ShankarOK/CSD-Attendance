'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

/**
 * Shared navbar used across landing (/), /form, /admin, and /preview.
 * Uses design tokens so colors stay consistent with the rest of the app.
 */
export function NavBar({
  currentUser,
  onLogout,
}: {
  currentUser: { username: string; role: string } | null
  onLogout: () => void
}) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-colors duration-200">
      <div className="flex h-14 w-full items-center px-4 sm:px-6 lg:px-8">
        {/* Brand — left */}
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            prefetch={true}
            className="flex items-center gap-2 font-semibold text-foreground hover:opacity-90 transition-opacity duration-200"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-glow-sm">
              <ClipboardList className="h-4 w-4" />
            </span>
            <span className="text-lg tracking-tight">Attendify</span>
          </Link>
        </div>

        {/* Nav — center (or left on small screens) */}
        <nav className="flex flex-1 items-center justify-center gap-1" aria-label="Main navigation">
          <Link
            href="/"
            prefetch={true}
            aria-current={pathname === '/' ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
              pathname === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            href="/form"
            prefetch={true}
            aria-current={pathname === '/form' ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
              pathname === '/form' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </Link>
          <Link
            href="/admin"
            prefetch={true}
            aria-current={pathname?.startsWith('/admin') ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
              pathname?.startsWith('/admin') ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </nav>

        {/* Actions — right */}
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {currentUser && (
            <>
              <span className="hidden sm:inline-flex items-center rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {currentUser.username}
              </span>
              <Button variant="ghost" size="sm" onClick={onLogout} className="gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
          {!currentUser && (
            <Link href="/login" prefetch={true}>
              <Button variant="ghost" size="sm" className="transition-colors duration-200">Sign in</Button>
            </Link>
          )}
          <Link href="/form" prefetch={true}>
            <Button size="sm" className="shadow-glow-sm hover:shadow-glow transition-all duration-200">Mark Attendance</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
