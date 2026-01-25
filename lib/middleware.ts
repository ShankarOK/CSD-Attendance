/**
 * Middleware utilities for authentication
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from './auth';

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return false;
    }

    const decoded = verifyToken(token);
    return decoded !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Require authentication - throws error if not authenticated (for use in API routes)
 * Returns true if authenticated, throws redirect if not
 */
export async function requireAuth(): Promise<true> {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }
  
  return true;
}

/**
 * Get current user from token
 */
export async function getCurrentUser(): Promise<{ userId: number; username: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

