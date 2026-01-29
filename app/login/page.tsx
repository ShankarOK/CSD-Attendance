'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import Toast from '@/components/Toast'

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
    } catch (err: any) {
      setToast({
        message: err?.name === 'AbortError' ? 'Request timed out. Try again.' : 'Login failed. Try again.',
        type: 'error',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sign in</h1>
              <p className="text-sm text-gray-600 mt-1">Access Attendify</p>
            </div>
            <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Back to home
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-3 hover:bg-indigo-700 disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-600">
            Don’t have an account?{' '}
            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}

