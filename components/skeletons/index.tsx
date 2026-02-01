'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Full-page centered skeleton for auth (login/register) */
export function AuthCardSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="border-2 shadow-card-hover overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="flex justify-center">
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/** Shell + main content skeleton for form/preview (with AppShell look) */
export function AppShellSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Skeleton className="h-6 w-24" />
          <nav className="flex items-center gap-2">
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </nav>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}

/** Form page content skeleton (selects, fields, table placeholder) */
export function FormPageSkeleton() {
  return (
    <AppShellSkeleton>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="border-2 overflow-hidden">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-muted/50 p-3 flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 flex-1" />
                ))}
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-2 p-3 border-t border-border">
                  <Skeleton className="h-10 w-12 rounded" />
                  <Skeleton className="h-10 flex-1 rounded" />
                  <Skeleton className="h-10 flex-1 rounded" />
                  <Skeleton className="h-10 w-20 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShellSkeleton>
  )
}

/** Preview page skeleton (document-style) */
export function PreviewPageSkeleton() {
  return (
    <AppShellSkeleton>
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Card className="overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-5 w-24 shrink-0" />
                  <Skeleton className="h-5 flex-1" />
                </div>
              ))}
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex border-b border-border pb-2 gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-8 flex-1" />
                  ))}
                </div>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex gap-2 py-3 border-b border-border">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShellSkeleton>
  )
}

/** Dashboard: tabs + content area skeleton */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Skeleton className="h-6 w-24" />
          <nav className="flex items-center gap-1 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-20 sm:w-28 rounded-lg shrink-0" />
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      </header>
      <main className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Card className="overflow-hidden border-2 shadow-card-hover mb-6">
          <div className="p-2 flex gap-1 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-12 w-24 sm:w-32 rounded-lg shrink-0" />
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-28" />
          </div>
          <Card className="overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <div className="min-w-[500px] p-4 space-y-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <div className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-16 rounded" />
                      <Skeleton className="h-8 w-16 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

/** Table rows skeleton (design tokens) */
export function TableSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <div className="animate-pulse">
        <div className="h-12 bg-muted/80 border-b border-border" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 border-b border-border last:border-0 flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32 sm:w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Inline button/small loader replacement */
export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-9 w-24 rounded-lg', className)} />
}
