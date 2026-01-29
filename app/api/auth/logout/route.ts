import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 * Logout admin user
 */
export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    
    // Delete cookie from response
    response.cookies.delete('auth_token')

    return response
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

