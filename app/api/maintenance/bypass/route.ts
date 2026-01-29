import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/maintenance/bypass
 * Verify maintenance bypass key and set cookie
 * 
 * Query params: ?key=<MAINTENANCE_SECRET>
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const providedKey = searchParams.get('key')
    const expectedKey = process.env.MAINTENANCE_SECRET

    // Check if maintenance mode is enabled
    if (process.env.MAINTENANCE_MODE !== 'true') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Maintenance mode is not enabled' 
        },
        { status: 400 }
      )
    }

    // Validate key
    if (!expectedKey) {
      console.error('MAINTENANCE_SECRET is not set in environment variables')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bypass system is not configured' 
        },
        { status: 500 }
      )
    }

    if (!providedKey || providedKey !== expectedKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid bypass key' 
        },
        { status: 401 }
      )
    }

    // Set bypass cookie
    const cookieStore = await cookies()
    cookieStore.set('maintenance_bypass', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Maintenance bypass activated',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error in maintenance bypass:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

// Also allow GET for convenience
export async function GET(request: Request) {
  return POST(request)
}
