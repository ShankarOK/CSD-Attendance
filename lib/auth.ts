/**
 * Authentication utilities
 */

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL!);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create admin user (for initial setup)
 */
export async function createAdminUser(username: string, password: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);
  
  await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (username) DO NOTHING
  `;
}

/**
 * Verify admin credentials
 */
export async function verifyAdmin(username: string, password: string): Promise<AdminUser | null> {
  try {
    const result = await sql`
      SELECT * FROM admin_users
      WHERE username = ${username}
      LIMIT 1
    `;
    
    if (result.length === 0) {
      return null;
    }
    
    const user = result[0] as AdminUser;
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    return isValid ? user : null;
  } catch (error) {
    console.error('Error verifying admin:', error);
    return null;
  }
}

/**
 * Generate JWT token
 */
export function generateToken(userId: number, username: string): string {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

