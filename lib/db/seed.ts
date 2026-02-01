/**
 * Script to seed the database with course data
 * Run with: npx tsx lib/db/seed.ts
 */

import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

interface CourseData {
  semester: number;
  courseName: string;
  courseCode: string;
}

interface TeacherData {
  name: string;
}

interface SemesterData {
  semester: number;
  classTeacher: string;
  totalStudents: number;
}

// Teachers data - All teachers can be class teachers and course faculty
const teacherData: TeacherData[] = [
  { name: 'Mr. Manjunatha G' },
  { name: 'Dr. Ramesh Kumar' },
  { name: 'Prof. Sunita Sharma' },
  { name: 'Mr. Anil Kumar' },
  { name: 'Dr. Priya Patel' },
  { name: 'Mr. Rajesh Singh' },
  { name: 'Dr. Meera Nair' },
  { name: 'Prof. Vikram Reddy' },
  { name: 'Dr. Arjun Desai' },
  { name: 'Prof. Kavita Menon' },
  { name: 'Mr. Suresh Iyer' },
  { name: 'Dr. Neha Gupta' },
  { name: 'Prof. Amit Joshi' },
  { name: 'Dr. Sanjay Verma' },
  { name: 'Prof. Radha Krishnan' },
  { name: 'Dr. Anjali Mehta' },
  { name: 'Mr. Vikas Sharma' },
  { name: 'Dr. Pooja Agarwal' },
  { name: 'Prof. Rahul Kapoor' },
  { name: 'Dr. Sneha Reddy' },
];

const semesterData: SemesterData[] = [
  { semester: 1, classTeacher: 'Mr. Manjunatha G', totalStudents: 50 },
  { semester: 2, classTeacher: 'Dr. Ramesh Kumar', totalStudents: 48 },
  { semester: 3, classTeacher: 'Prof. Sunita Sharma', totalStudents: 52 },
  { semester: 4, classTeacher: 'Mr. Anil Kumar', totalStudents: 49 },
  { semester: 5, classTeacher: 'Dr. Priya Patel', totalStudents: 51 },
  { semester: 6, classTeacher: 'Mr. Rajesh Singh', totalStudents: 47 },
  { semester: 7, classTeacher: 'Dr. Meera Nair', totalStudents: 53 },
  { semester: 8, classTeacher: 'Prof. Vikram Reddy', totalStudents: 45 },
];

const courseData: CourseData[] = [
  // 1st Semester
  { semester: 1, courseName: 'Mathematics for Engineers', courseCode: '1BMA101' },
  { semester: 1, courseName: 'Physics for Engineers', courseCode: '1BPH102' },
  { semester: 1, courseName: 'Chemistry for Engineers', courseCode: '1BCH103' },
  { semester: 1, courseName: 'Engineering Graphics', courseCode: '1BEG104' },
  { semester: 1, courseName: 'Programming Fundamentals', courseCode: '1BCS105' },
  { semester: 1, courseName: 'Communication Skills', courseCode: '1BHS106' },
  { semester: 1, courseName: 'Environmental Studies', courseCode: '1BES107' },
  
  // 2nd Semester (Keep existing - DO NOT CHANGE)
  { semester: 2, courseName: 'Essential of Information Technology', courseCode: '1BESC104E' },
  { semester: 2, courseName: 'Programming in C', courseCode: '1BIT205' },
  { semester: 2, courseName: 'Programming in C Lab', courseCode: '1BIT205' },
  { semester: 2, courseName: 'Interdisciplinary project based learning', courseCode: '1BPRJ258' },
  
  // 3rd Semester
  { semester: 3, courseName: 'Data Structures and Algorithms', courseCode: 'BCS301' },
  { semester: 3, courseName: 'Object-Oriented Programming', courseCode: 'BCS302' },
  { semester: 3, courseName: 'Digital Logic Design', courseCode: 'BCS303' },
  { semester: 3, courseName: 'Computer Organization', courseCode: 'BCS304' },
  { semester: 3, courseName: 'Data Structures Lab', courseCode: 'BCSL305' },
  { semester: 3, courseName: 'Object-Oriented Programming Lab', courseCode: 'BCSL306' },
  { semester: 3, courseName: 'Mathematics III', courseCode: 'BMA307' },
  { semester: 3, courseName: 'Professional Ethics', courseCode: 'BHU308' },
  
  // 4th Semester (Keep existing - DO NOT CHANGE)
  { semester: 4, courseName: 'Analysis & Design of Algorithms', courseCode: 'BCS401' },
  { semester: 4, courseName: 'Computer Graphics & Visualization', courseCode: 'BCS402' },
  { semester: 4, courseName: 'Database Management systems', courseCode: 'BCS403' },
  { semester: 4, courseName: 'Discrete Mathematical Structures', courseCode: 'BCS405A' },
  { semester: 4, courseName: 'Analysis & Design of Algorithms Lab', courseCode: 'BCSL404' },
  { semester: 4, courseName: 'Responsive Web design with Bootstrap 5.0', courseCode: 'BCGL456B' },
  { semester: 4, courseName: 'Biology for Computer Engineers', courseCode: 'BBOC407' },
  { semester: 4, courseName: 'Universal Human Values', courseCode: 'BUHK408' },
  { semester: 4, courseName: 'Yoga', courseCode: 'BYOK459' },
  
  // 5th Semester
  { semester: 5, courseName: 'Operating Systems', courseCode: 'BCS501' },
  { semester: 5, courseName: 'Computer Networks', courseCode: 'BCS502' },
  { semester: 5, courseName: 'Software Engineering', courseCode: 'BCS503' },
  { semester: 5, courseName: 'Web Technologies', courseCode: 'BCS504' },
  { semester: 5, courseName: 'Operating Systems Lab', courseCode: 'BCSL505' },
  { semester: 5, courseName: 'Computer Networks Lab', courseCode: 'BCSL506' },
  { semester: 5, courseName: 'Web Technologies Lab', courseCode: 'BCSL507' },
  { semester: 5, courseName: 'Management Studies', courseCode: 'BMS508' },
  
  // 6th Semester (Keep existing - DO NOT CHANGE)
  { semester: 6, courseName: 'Machine Learning', courseCode: 'BCG601' },
  { semester: 6, courseName: 'Design Processes and Perspectives', courseCode: 'BCG602' },
  { semester: 6, courseName: 'Cloud Computing and Security', courseCode: 'BIS613B' },
  { semester: 6, courseName: 'Project Phase 1', courseCode: 'BCG685' },
  { semester: 6, courseName: 'UI/UX lab', courseCode: 'BCGL606' },
  { semester: 6, courseName: 'Indian Knowledge System', courseCode: 'BIKS609' },
  { semester: 6, courseName: 'Generative AI', courseCode: 'BAIL657C' },
  { semester: 6, courseName: 'Yoga', courseCode: 'BYOK658' },
  
  // 7th Semester
  { semester: 7, courseName: 'Artificial Intelligence', courseCode: 'BCS701' },
  { semester: 7, courseName: 'Cybersecurity', courseCode: 'BCS702' },
  { semester: 7, courseName: 'Big Data Analytics', courseCode: 'BCS703' },
  { semester: 7, courseName: 'Internet of Things', courseCode: 'BCS704' },
  { semester: 7, courseName: 'Project Phase 2', courseCode: 'BCG785' },
  { semester: 7, courseName: 'AI Lab', courseCode: 'BCSL705' },
  { semester: 7, courseName: 'IoT Lab', courseCode: 'BCSL706' },
  { semester: 7, courseName: 'Entrepreneurship Development', courseCode: 'BED707' },
  
  // 8th Semester
  { semester: 8, courseName: 'Project Management', courseCode: 'BCS801' },
  { semester: 8, courseName: 'Research Methodology', courseCode: 'BCS802' },
  { semester: 8, courseName: 'Final Year Project', courseCode: 'BCG885' },
  { semester: 8, courseName: 'Industrial Training', courseCode: 'BCS803' },
  { semester: 8, courseName: 'Seminar', courseCode: 'BCS804' },
  { semester: 8, courseName: 'Technical Writing', courseCode: 'BHS805' },
];

async function seedDatabase() {
  try {
    console.log('Creating teachers table if it does not exist...');
    
    // Create teachers table
    await sql`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for teachers
    await sql`
      CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name)
    `;
    
    console.log('Teachers table created successfully!');
    console.log('Inserting teacher data...');

    // Insert teachers
    for (const teacher of teacherData) {
      try {
        await sql`
          INSERT INTO teachers (name)
          VALUES (${teacher.name})
          ON CONFLICT (name) DO UPDATE
          SET updated_at = CURRENT_TIMESTAMP
        `;
        console.log(`✓ Inserted/Updated: ${teacher.name}`);
      } catch (error) {
        console.error(`✗ Failed to insert teacher ${teacher.name}:`, error);
      }
    }

    console.log('\nCreating semesters table if it does not exist...');
    
    // Create semesters table (without foreign key constraint for now to avoid issues)
    await sql`
      CREATE TABLE IF NOT EXISTS semesters (
        id SERIAL PRIMARY KEY,
        semester INTEGER NOT NULL UNIQUE,
        class_teacher VARCHAR(255) NOT NULL,
        total_students INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index for semesters
    await sql`
      CREATE INDEX IF NOT EXISTS idx_semesters_semester ON semesters(semester)
    `;

    console.log('Semesters table created successfully!');
    console.log('Inserting semester data...');

    // Insert semesters
    for (const sem of semesterData) {
      try {
        await sql`
          INSERT INTO semesters (semester, class_teacher, total_students)
          VALUES (${sem.semester}, ${sem.classTeacher}, ${sem.totalStudents})
          ON CONFLICT (semester) DO UPDATE
          SET class_teacher = EXCLUDED.class_teacher,
              total_students = EXCLUDED.total_students,
              updated_at = CURRENT_TIMESTAMP
        `;
        console.log(`✓ Inserted/Updated: Semester ${sem.semester} - ${sem.classTeacher} (${sem.totalStudents} students)`);
      } catch (error) {
        console.error(`✗ Failed to insert semester ${sem.semester}:`, error);
      }
    }

    console.log('\nCreating academic_year_settings table if it does not exist...');
    
    // Create academic_year_settings table
    await sql`
      CREATE TABLE IF NOT EXISTS academic_year_settings (
        id SERIAL PRIMARY KEY,
        current_academic_year VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Academic year settings table created successfully!');

    console.log('\nCreating courses table if it does not exist...');
    
    // Create courses table
    await sql`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        semester INTEGER NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        course_code VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(semester, course_code)
      )
    `;

    // Create indexes for courses
    await sql`
      CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code)
    `;

    console.log('Courses table created successfully!');
    console.log('Inserting course data...');

    // Insert courses
    for (const course of courseData) {
      try {
        await sql`
          INSERT INTO courses (semester, course_name, course_code)
          VALUES (${course.semester}, ${course.courseName}, ${course.courseCode})
          ON CONFLICT (semester, course_code) DO NOTHING
        `;
        console.log(`✓ Inserted: ${course.courseCode} - ${course.courseName}`);
      } catch (error) {
        console.error(`✗ Failed to insert ${course.courseCode}:`, error);
      }
    }

    // Verify insertion
    const result = await sql`
      SELECT COUNT(*) as count FROM courses
    `;
    
    console.log(`\n✓ Database seeded successfully!`);
    console.log(`Total courses in database: ${result[0].count}`);
    
    // Show courses by semester
    const bySemester = await sql`
      SELECT semester, COUNT(*) as count
      FROM courses
      GROUP BY semester
      ORDER BY semester
    `;
    
    console.log('\nCourses by semester:');
    for (const row of bySemester) {
      console.log(`  Semester ${row.semester}: ${row.count} courses`);
    }

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();

