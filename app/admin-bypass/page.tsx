'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

/**
 * Admin Bypass Page
 * Allows admin to bypass maintenance mode by providing secret key
 * Sets maintenance_bypass cookie if key is valid
 */
function AdminBypassContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const keyParam = searchParams?.get('key')
    
    // Handle missing key
    if (!keyParam || keyParam.trim() === '') {
      setStatus('error')
      setMessage('No bypass key provided. Please provide ?key=<your-secret-key>')
      return
    }

    // At this point, keyParam is guaranteed to be a non-empty string
    const key: string = keyParam

    // Verify key by calling API
    async function verifyBypass(bypassKey: string) {
      try {
        const response = await fetch(`/api/maintenance/bypass?key=${encodeURIComponent(bypassKey)}`, {
          method: 'POST',
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setStatus('success')
          setMessage('Maintenance bypass activated! Redirecting...')
          
          // Redirect to home page after 1 second
          setTimeout(() => {
            router.push('/')
          }, 1000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Invalid bypass key')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Failed to verify bypass key. Please try again.')
      }
    }

    verifyBypass(key)
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border">
          <div className="text-center">
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              {status === 'checking' && (
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              )}
              {status === 'success' && (
                <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {status === 'error' && (
                <div className="w-16 h-16 bg-red-500/15 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Maintenance Bypass
            </h1>

            {/* Status Message */}
            <div className="mb-6">
              {status === 'checking' && (
                <p className="text-muted-foreground">Verifying bypass key...</p>
              )}
              {status === 'success' && (
                <div>
                  <p className="text-green-600 dark:text-green-400 font-semibold mb-2">✓ Success!</p>
                  <p className="text-muted-foreground text-sm">{message}</p>
                </div>
              )}
              {status === 'error' && (
                <div>
                  <p className="text-red-600 dark:text-red-400 font-semibold mb-2">✗ Error</p>
                  <p className="text-muted-foreground text-sm">{message}</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            {status === 'error' && (
              <div className="mt-6 p-4 bg-muted rounded-lg border border-border">
                <p className="text-sm text-foreground mb-2">
                  <strong>Usage:</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Visit: <code className="bg-muted px-2 py-1 rounded border border-border">/admin-bypass?key=YOUR_SECRET_KEY</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminBypassPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AdminBypassContent />
    </Suspense>
  )
}
