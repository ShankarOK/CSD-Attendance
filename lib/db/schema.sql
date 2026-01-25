-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name);

-- Create semesters table
CREATE TABLE IF NOT EXISTS semesters (
  id SERIAL PRIMARY KEY,
  semester INTEGER NOT NULL UNIQUE,
  class_teacher VARCHAR(255) NOT NULL,
  total_students INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_teacher) REFERENCES teachers(name) ON DELETE RESTRICT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_semesters_semester ON semesters(semester);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  semester INTEGER NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  course_code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(semester, course_code)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- Create academic year settings table
CREATE TABLE IF NOT EXISTS academic_year_settings (
  id SERIAL PRIMARY KEY,
  current_academic_year VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

