'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Toast from '@/components/Toast'

type Teacher = { id: number; name: string }
type Role = 'teacher' | 'admin'

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('teacher')
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
        // ignore - teachers list is optional for admin role
      }
    }
    loadTeachers()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (role === 'admin') setTeacherId('')
  }, [role])

  const canSubmit = useMemo(() => {
    if (!username.trim()) return false
    if (password.length < 6) return false
    if (password !== confirm) return false
    if (role === 'teacher' && teacherId === '') return false
    return true
  }, [username, password, confirm, role, teacherId])

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
          role,
          teacherId: role === 'teacher' ? Number(teacherId) : null,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-lg">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create account</h1>
              <p className="text-sm text-gray-600 mt-1">Register for Attendify</p>
            </div>
            <Link href="/" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Back to home
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRole('teacher')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold border ${
                role === 'teacher'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold border ${
                role === 'admin'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : '')}
                  disabled={isLoading}
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">This links your login to a teacher identity.</p>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
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
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters.</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-3 hover:bg-indigo-700 disabled:opacity-60"
            >
              {isLoading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

