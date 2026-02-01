import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, verifyAuthToken } from './lib/auth'
import { sessionExists } from './lib/session'

/**
 * Maintenance Mode + Authentication Proxy
 *
 * Environment Variables Required:
 * - MAINTENANCE_MODE: 'true' | 'false' (default: 'false')
 * - MAINTENANCE_SECRET: Secret key for admin bypass
 * - JWT_SECRET: secret for signed auth cookie (HS256)
 *
 * Behavior:
 * Maintenance Mode:
 *    - If MAINTENANCE_MODE=true → Redirect users to /maintenance
 *    - Admin can bypass by visiting /admin-bypass?key=<MAINTENANCE_SECRET>
 *    - Cookie maintenance_bypass=true allows full access
 *
 * Auth:
 *    - Non-public routes require valid auth cookie
 *    - /admin and /api/admin/* require role=admin
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always let Next internal assets through
  if (pathname.startsWith('/_next')) return NextResponse.next()

  // Public paths that never require auth
  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/maintenance' ||
    pathname.startsWith('/admin-bypass') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/maintenance/bypass')

  // First, handle maintenance mode (may redirect to /maintenance)
  const maintenanceResult = handleMaintenanceMode(request, { isPublic })
  if (maintenanceResult) return maintenanceResult

  // Public routes after maintenance check
  if (isPublic) return NextResponse.next()

  // Auth check for protected routes
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) {
    return redirectToLogin(request)
  }

  // Verify token (async) - proxy supports async return
  return verifyAndAuthorize(request, token)
}

/**
 * Handle maintenance mode check
 */
function handleMaintenanceMode(request: NextRequest, opts: { isPublic: boolean }) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true'

  // If maintenance mode is OFF, allow request
  if (!maintenanceMode) {
    return null
  }

  const { pathname } = request.nextUrl

  // Always allow these paths during maintenance
  const allowedPaths = [
    '/maintenance',
    '/admin-bypass',
    '/_next',
    '/api/maintenance/bypass',
    '/api/auth',
    '/login',
    '/register',
  ]

  const isAllowedPath = allowedPaths.some(path =>
    pathname === path || pathname.startsWith(path)
  )

  if (isAllowedPath) {
    return null
  }

  // Check for maintenance bypass cookie
  const bypassCookie = request.cookies.get('maintenance_bypass')
  if (bypassCookie?.value === 'true') {
    return null
  }

  // Redirect to maintenance page
  const maintenanceUrl = new URL('/maintenance', request.url)
  maintenanceUrl.searchParams.set('redirect', pathname)

  return NextResponse.redirect(maintenanceUrl)
}

function redirectToLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  // API routes should return JSON 401
  if (pathname.startsWith('/api')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', `${pathname}${search}`)
  return NextResponse.redirect(loginUrl)
}

async function verifyAndAuthorize(request: NextRequest, token: string) {
  const { pathname } = request.nextUrl
  const decoded = await verifyAuthToken(token)
  if (!decoded) {
    if (pathname.startsWith('/api')) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      res.cookies.delete(AUTH_COOKIE_NAME)
      return res
    }
    const res = redirectToLogin(request)
    res.cookies.delete(AUTH_COOKIE_NAME)
    return res
  }

  // If token has sessionId, ensure session still exists (revoked sessions)
  if (decoded.sessionId) {
    const exists = await sessionExists(decoded.sessionId)
    if (!exists) {
      if (pathname.startsWith('/api')) {
        const res = NextResponse.json({ error: 'Session expired' }, { status: 401 })
        res.cookies.delete(AUTH_COOKIE_NAME)
        return res
      }
      const res = redirectToLogin(request)
      res.cookies.delete(AUTH_COOKIE_NAME)
      return res
    }
  }

  // Admin-only routes
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApi = pathname.startsWith('/api/admin')
  if ((isAdminRoute || isAdminApi) && decoded.role !== 'admin') {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Configure which routes this proxy runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately if needed)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
