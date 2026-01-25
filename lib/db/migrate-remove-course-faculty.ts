/**
 * Migration script to remove can_be_course_faculty column from teachers table
 * Run with: npx tsx lib/db/migrate-remove-course-faculty.ts
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log('Starting migration: Removing can_be_course_faculty column...');
    
    // Drop the index first
    console.log('Dropping index idx_teachers_course_faculty...');
    await sql`
      DROP INDEX IF EXISTS idx_teachers_course_faculty
    `;
    console.log('✓ Index dropped');
    
    // Remove the column
    console.log('Removing can_be_course_faculty column...');
    await sql`
      ALTER TABLE teachers
      DROP COLUMN IF EXISTS can_be_course_faculty
    `;
    console.log('✓ Column removed');
    
    console.log('\n✓ Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();

