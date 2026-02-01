/**
 * Migration: create `sessions` table for auth session tracking
 * Run with: npm run db:migrate-sessions
 */

import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL!)

async function migrate() {
  try {
    console.log('Creating sessions table...')

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC)
    `

    console.log('✓ Sessions table created')
  } catch (err) {
    console.error('Sessions migration failed:', err)
    process.exit(1)
  }
}

migrate()
