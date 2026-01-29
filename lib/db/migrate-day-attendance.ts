/**
 * Migration script to create DayAttendance and SessionAttendance tables
 * Run with: npm run db:migrate-day-attendance
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log('Starting migration: Creating DayAttendance and SessionAttendance tables...');
    
    // Create DayAttendance table
    console.log('Creating day_attendance table...');
    await sql`
      CREATE TABLE IF NOT EXISTS day_attendance (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        program VARCHAR(255) NOT NULL DEFAULT 'Bachelor in Engineering',
        department VARCHAR(255) NOT NULL DEFAULT 'Computer Science and Design',
        academic_year VARCHAR(50) NOT NULL,
        semester INTEGER NOT NULL,
        class_teacher_id INTEGER NOT NULL,
        total_students INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINALIZED')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
        UNIQUE(date, semester, department, program, academic_year, class_teacher_id)
      )
    `;
    console.log('✓ day_attendance table created');

    // Create indexes for day_attendance
    console.log('Creating indexes for day_attendance...');
    await sql`CREATE INDEX IF NOT EXISTS idx_day_attendance_date ON day_attendance(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_day_attendance_semester ON day_attendance(semester)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_day_attendance_class_teacher ON day_attendance(class_teacher_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_day_attendance_status ON day_attendance(status)`;
    console.log('✓ Indexes created for day_attendance');

    // Create SessionAttendance table
    console.log('Creating session_attendance table...');
    await sql`
      CREATE TABLE IF NOT EXISTS session_attendance (
        id SERIAL PRIMARY KEY,
        day_attendance_id INTEGER NOT NULL,
        hour_no INTEGER NOT NULL CHECK (hour_no >= 1 AND hour_no <= 8),
        room_no VARCHAR(50),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        course_code VARCHAR(50) NOT NULL,
        faculty_id INTEGER NOT NULL,
        students_present INTEGER NOT NULL DEFAULT 0 CHECK (students_present >= 0),
        students_absent INTEGER NOT NULL DEFAULT 0 CHECK (students_absent >= 0),
        signature VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (day_attendance_id) REFERENCES day_attendance(id) ON DELETE CASCADE,
        FOREIGN KEY (faculty_id) REFERENCES teachers(id) ON DELETE RESTRICT,
        UNIQUE(day_attendance_id, hour_no),
        CHECK (end_time > start_time)
      )
    `;
    console.log('✓ session_attendance table created');

    // Create indexes for session_attendance
    console.log('Creating indexes for session_attendance...');
    await sql`CREATE INDEX IF NOT EXISTS idx_session_attendance_day ON session_attendance(day_attendance_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_session_attendance_faculty ON session_attendance(faculty_id)`;
    console.log('✓ Indexes created for session_attendance');

    // Create function to update updated_at timestamp
    console.log('Creating update_updated_at_column function...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;
    console.log('✓ Function created');

    // Create triggers
    console.log('Creating triggers...');
    await sql`
      DROP TRIGGER IF EXISTS update_day_attendance_updated_at ON day_attendance
    `;
    await sql`
      CREATE TRIGGER update_day_attendance_updated_at 
      BEFORE UPDATE ON day_attendance
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;
    
    await sql`
      DROP TRIGGER IF EXISTS update_session_attendance_updated_at ON session_attendance
    `;
    await sql`
      CREATE TRIGGER update_session_attendance_updated_at 
      BEFORE UPDATE ON session_attendance
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;
    console.log('✓ Triggers created');
    
    console.log('\n✅ Migration completed successfully!');
    console.log('Tables created:');
    console.log('  - day_attendance');
    console.log('  - session_attendance');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

migrate();
