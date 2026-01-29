-- Migration: Create DayAttendance and SessionAttendance tables
-- Run this migration to add day-wise attendance tracking

-- Create DayAttendance table
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
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_day_attendance_date ON day_attendance(date);
CREATE INDEX IF NOT EXISTS idx_day_attendance_semester ON day_attendance(semester);
CREATE INDEX IF NOT EXISTS idx_day_attendance_class_teacher ON day_attendance(class_teacher_id);
CREATE INDEX IF NOT EXISTS idx_day_attendance_status ON day_attendance(status);
CREATE INDEX IF NOT EXISTS idx_day_attendance_unique ON day_attendance(date, semester, department, program, academic_year, class_teacher_id);

-- Create SessionAttendance table
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
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_session_attendance_day ON session_attendance(day_attendance_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_faculty ON session_attendance(faculty_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_unique ON session_attendance(day_attendance_id, hour_no);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_day_attendance_updated_at BEFORE UPDATE ON day_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_attendance_updated_at BEFORE UPDATE ON session_attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
