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
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

