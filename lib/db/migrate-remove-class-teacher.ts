/**
 * Migration script to remove can_be_class_teacher column from teachers table
 * Run with: npx tsx lib/db/migrate-remove-class-teacher.ts
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log('Starting migration: Removing can_be_class_teacher column...');
    
    // Drop the index first
    console.log('Dropping index idx_teachers_class_teacher...');
    await sql`
      DROP INDEX IF EXISTS idx_teachers_class_teacher
    `;
    console.log('✓ Index dropped');
    
    // Remove the column
    console.log('Removing can_be_class_teacher column...');
    await sql`
      ALTER TABLE teachers
      DROP COLUMN IF EXISTS can_be_class_teacher
    `;
    console.log('✓ Column removed');
    
    console.log('\n✓ Migration completed successfully!');
    console.log('All teachers can now be class teachers.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrate();

