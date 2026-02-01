/**
 * Session validation for middleware (Edge-safe: uses Neon serverless)
 */

import { neon } from '@neondatabase/serverless'

export async function sessionExists(sessionId: string): Promise<boolean> {
  const url = process.env.DATABASE_URL
  if (!url) return true // no DB = allow (e.g. build time)
  try {
    const sql = neon(url)
    const result = await sql`SELECT 1 FROM sessions WHERE id = ${sessionId} LIMIT 1`
    return result.length > 0
  } catch {
    return true // on error allow (e.g. table not yet created)
  }
}
