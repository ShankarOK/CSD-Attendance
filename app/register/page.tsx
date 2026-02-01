'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import Toast from '@/components/Toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'
import { cn } from '@/lib/utils'

type Teacher = { id: number; name: string }

export default function RegisterPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [teacherId, setTeacherId] = useState<number | ''>('')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadTeachers() {
      try {
        const res = await fetch('/api/teachers', { cache: 'no-store' })
        const data = await res.json()
        if (!cancelled && Array.isArray(data)) setTeachers(data)
      } catch {
        // ignore
      }
    }
    loadTeachers()
    return () => {
      cancelled = true
    }
  }, [])

  const canSubmit = useMemo(() => {
    if (!username.trim()) return false
    if (password.length < 6) return false
    if (password !== confirm) return false
    if (teacherId === '') return false
    return true
  }, [username, password, confirm, teacherId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          username,
          password,
          role: 'teacher',
          teacherId: Number(teacherId),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setToast({ message: data.error || 'Registration failed', type: 'error' })
        setIsLoading(false)
        return
      }

      setToast({ message: 'Account created. Redirecting…', type: 'success' })
      setTimeout(() => {
        window.location.href = '/'
      }, 450)
    } catch {
      setToast({ message: 'Registration failed. Try again.', type: 'error' })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12 relative">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        <Card className="border-2 shadow-card-hover">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow-sm">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">Create account</CardTitle>
                  <CardDescription className="mt-0.5">Register for Attendify</CardDescription>
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
                <Label htmlFor="teacher">Faculty profile</Label>
                <select
                  id="teacher"
                  className={cn(
                    'flex h-11 w-full rounded-lg border-2 border-border bg-background px-4 py-2 text-base',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary',
                    'disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : '')}
                  disabled={isLoading}
                  required
                >
                  <option value="">Select your name</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Link your account to your faculty profile.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    required
                    placeholder="Username"
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
                    required
                    placeholder="Min 6 characters"
                  />
                  <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={isLoading}
                  required
                  placeholder="Confirm password"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading || !canSubmit}>
                {isLoading ? 'Creating…' : 'Create account'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
