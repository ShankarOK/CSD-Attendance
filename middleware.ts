import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Maintenance Mode Middleware
 * 
 * Environment Variables Required:
 * - MAINTENANCE_MODE: 'true' | 'false' (default: 'false')
 * - MAINTENANCE_SECRET: Secret key for admin bypass
 * 
 * Behavior:
 * Maintenance Mode:
 *    - If MAINTENANCE_MODE=true → Redirect users to /maintenance
 *    - Admin can bypass by visiting /admin-bypass?key=<MAINTENANCE_SECRET>
 *    - Cookie maintenance_bypass=true allows full access
 */
export function middleware(request: NextRequest) {
  // All routes are public - only check maintenance mode
  return handleMaintenanceMode(request)
}

/**
 * Handle maintenance mode check
 */
function handleMaintenanceMode(request: NextRequest) {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true'
  
  // If maintenance mode is OFF, allow request
  if (!maintenanceMode) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl

  // Always allow these paths during maintenance
  const allowedPaths = [
    '/maintenance',
    '/admin-bypass',
    '/_next',
    '/api/maintenance/bypass',
  ]

  const isAllowedPath = allowedPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  )

  if (isAllowedPath) {
    return NextResponse.next()
  }

  // Check for maintenance bypass cookie
  const bypassCookie = request.cookies.get('maintenance_bypass')
  if (bypassCookie?.value === 'true') {
    return NextResponse.next()
  }

  // Redirect to maintenance page
  const maintenanceUrl = new URL('/maintenance', request.url)
  maintenanceUrl.searchParams.set('redirect', pathname)
  
  return NextResponse.redirect(maintenanceUrl)
}

// Configure which routes this middleware runs on
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
