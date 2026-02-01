'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ClipboardCheck } from 'lucide-react'
import Toast from '@/components/Toast'
import { AuthCardSkeleton } from '@/components/skeletons'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'

function LoginContent() {
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 12000)

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        cache: 'no-store',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setToast({ message: data.error || 'Login failed', type: 'error' })
        setIsLoading(false)
        return
      }

      setToast({ message: 'Signed in. Redirecting…', type: 'success' })
      const redirectTo = searchParams?.get('redirect') || '/'
      setTimeout(() => {
        window.location.href = redirectTo
      }, 450)
    } catch (err: unknown) {
      setToast({
        message: (err as { name?: string })?.name === 'AbortError' ? 'Request timed out. Try again.' : 'Login failed. Try again.',
        type: 'error',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <Card className="border-2 shadow-card-hover">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow-sm">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">Sign in</CardTitle>
                  <CardDescription className="mt-0.5">Use your account to continue</CardDescription>
                </div>
              </div>
              <Link href="/" className="text-sm font-semibold text-primary hover:underline">
                Back to home
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="username"
                  required
                  placeholder="Enter your username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <LoginContent />
    </Suspense>
  )
}
