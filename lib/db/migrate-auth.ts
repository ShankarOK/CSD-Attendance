/**
 * Migration: create `users` table for authentication
 *
 * Run with:
 *   npm run db:migrate-auth
 */

import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL!)

async function migrate() {
  try {
    console.log('Creating users table (auth)...')

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'teacher',
        teacher_id INTEGER NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT users_role_check CHECK (role IN ('admin', 'teacher')),
        CONSTRAINT users_teacher_fk FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
      )
    `

    // Ensure only one account per teacher (optional but sane default)
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_teacher_unique
      ON users(teacher_id)
      WHERE teacher_id IS NOT NULL
    `

    // Updated_at trigger (aligns with your other tables)
    await sql`
      CREATE OR REPLACE FUNCTION set_updated_at_users()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    await sql`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users
    `

    await sql`
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at_users();
    `

    console.log('✓ Auth migration complete (users table ready)')
  } catch (err) {
    console.error('Auth migration failed:', err)
    process.exit(1)
  }
}

migrate()

