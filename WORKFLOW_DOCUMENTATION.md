# Complete Workflow Documentation - Daily Attendance Web Application

## 📋 Overview

This is a **Day-Wise Attendance Management System** for PES Institute of Technology and Management, Shimoga - Department of Computer Science and Design. The application allows teachers to record attendance session-wise (hour-by-hour) and group them under a single day record.

---

## 🏗️ Architecture Overview

### **Technology Stack**
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: PostgreSQL (Neon Serverless)
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **Print**: react-to-print library
- **Form Management**: react-hook-form
- **Deployment**: Vercel

### **Database Schema**

#### **Core Tables**

1. **`teachers`**
   - `id` (SERIAL PRIMARY KEY)
   - `name` (VARCHAR(255) UNIQUE)
   - `created_at`, `updated_at`

2. **`semesters`**
   - `id` (SERIAL PRIMARY KEY)
   - `semester` (INTEGER UNIQUE, 1-8)
   - `class_teacher` (VARCHAR(255) → FK teachers.name)
   - `total_students` (INTEGER)
   - `created_at`, `updated_at`

3. **`courses`**
   - `id` (SERIAL PRIMARY KEY)
   - `semester` (INTEGER)
   - `course_name` (VARCHAR(255))
   - `course_code` (VARCHAR(50))
   - `created_at`, `updated_at`
   - UNIQUE(semester, course_code)

4. **`admin_users`**
   - `id` (SERIAL PRIMARY KEY)
   - `username` (VARCHAR(255) UNIQUE)
   - `password_hash` (VARCHAR(255))
   - `created_at`, `updated_at`

5. **`academic_year_settings`**
   - `id` (SERIAL PRIMARY KEY)
   - `current_academic_year` (VARCHAR(50))
   - `created_at`, `updated_at`

#### **Attendance Tables** (New)

6. **`day_attendance`**
   - `id` (SERIAL PRIMARY KEY)
   - `date` (DATE)
   - `program` (VARCHAR(255), default: 'Bachelor in Engineering')
   - `department` (VARCHAR(255), default: 'Computer Science and Design')
   - `academic_year` (VARCHAR(50))
   - `semester` (INTEGER)
   - `class_teacher_id` (INTEGER → FK teachers.id)
   - `total_students` (INTEGER)
   - `status` (VARCHAR(20), CHECK: 'DRAFT' | 'FINALIZED')
   - `created_at`, `updated_at`
   - **UNIQUE(date, semester, department, program, academic_year, class_teacher_id)**

7. **`session_attendance`**
   - `id` (SERIAL PRIMARY KEY)
   - `day_attendance_id` (INTEGER → FK day_attendance.id, CASCADE DELETE)
   - `hour_no` (INTEGER, CHECK: 1-8)
   - `room_no` (VARCHAR(50))
   - `start_time` (TIME)
   - `end_time` (TIME)
   - `course_code` (VARCHAR(50))
   - `faculty_id` (INTEGER → FK teachers.id)
   - `students_present` (INTEGER, CHECK: >= 0)
   - `students_absent` (INTEGER, CHECK: >= 0, auto-calculated)
   - `signature` (VARCHAR(255), optional)
   - `created_at`, `updated_at`
   - **UNIQUE(day_attendance_id, hour_no)**
   - **CHECK(end_time > start_time)**

---

## 🔄 Complete User Workflow

### **Phase 1: Landing Page** (`/`)

**Route**: `app/page.tsx` → Renders `app/HomePageClient.tsx`

**Features**:
- Displays institution information
- Navigation buttons:
  - **"Attendance Form"** → `/form`
  - **"Admin Dashboard"** → `/admin` (if authenticated) or `/admin/login`

**Technical Details**:
- Server Component (`page.tsx`) for SEO metadata
- Client Component (`HomePageClient.tsx`) for interactivity
- Checks admin authentication status via `/api/auth/me`
- Responsive design with Tailwind CSS

---

### **Phase 2: Attendance Form** (`/form`)

**Route**: `app/form/page.tsx` → Renders `components/AttendanceForm.tsx`

#### **Step 1: Form Initialization**

**User Actions**:
1. Select **Academic Year** (dropdown)
2. Select **Semester** (1-8)
3. Select **Date** (date picker)

**Backend Process**:
- When semester is selected → Auto-fetches semester data:
  - **API**: `GET /api/semesters?semester={number}`
  - **Response**: `{ semester, class_teacher, total_students }`
  - Auto-populates **Class Teacher** and **Total Students** fields

**Auto-Load Day Attendance**:
- Triggered when: `date` + `semester` + `academicYear` + `classTeacher` + `totalStudents` are all set
- **API**: `POST /api/attendance/day/get-or-create`
- **Request Body**:
  ```json
  {
    "date": "2025-01-29",
    "semester": 6,
    "department": "Computer Science and Design",
    "program": "Bachelor in Engineering",
    "academicYear": "2025-26",
    "classTeacherName": "Dr. John Doe",
    "totalStudents": 50
  }
  ```
- **Response**:
  ```json
  {
    "dayAttendance": {
      "id": 123,
      "date": "2025-01-29",
      "semester": 6,
      "status": "DRAFT",
      "class_teacher_id": 5,
      "total_students": 50,
      ...
    },
    "sessions": [
      {
        "id": 456,
        "hour_no": 1,
        "room_no": "A101",
        "start_time": "09:00:00",
        "end_time": "10:00:00",
        "course_code": "CS301",
        "faculty_id": 3,
        "students_present": 45,
        "students_absent": 5,
        ...
      },
      ...
    ]
  }
  ```
- **Frontend Behavior**:
  - If day attendance exists → Loads all saved sessions into form
  - If new → Creates DRAFT day attendance, shows empty form
  - Displays loading indicator: "Loading saved sessions..."
  - Shows success toast: "Loaded X saved session(s)"

#### **Step 2: Fill Session Details**

**Form Fields Per Hour (8 hours)**:
- **Hour No.**: Auto-numbered (1-8)
- **Room No.**: Text input
- **Start Time**: Time picker (HH:MM)
- **End Time**: Time picker (HH:MM)
- **Course Code**: Dropdown (filtered by selected semester)
- **Course Faculty**: Dropdown (all teachers)
- **No. of Students Present**: Number input (0 to totalStudents)
- **No. of Students Absent**: Auto-calculated (totalStudents - present)
- **Action**: "Save" button

**Validation Rules**:
- End time must be after start time
- Present count cannot exceed total students
- All fields required before saving

#### **Step 3: Save Individual Sessions**

**User Action**: Click "Save" button on any hour row

**Backend Process**:
- **API**: `POST /api/attendance/session/upsert`
- **Request Body**:
  ```json
  {
    "dayAttendanceId": 123,
    "hourNo": 1,
    "roomNo": "A101",
    "startTime": "09:00",
    "endTime": "10:00",
    "courseCode": "CS301",
    "facultyName": "Dr. Jane Smith",
    "studentsPresent": 45,
    "studentsAbsent": 5
  }
  ```
- **Validation**:
  - Checks day attendance exists and is DRAFT
  - Validates time range (end > start)
  - Validates present <= totalStudents
  - Resolves faculty name to ID
- **Database**: UPSERT operation (INSERT or UPDATE based on `dayAttendanceId` + `hourNo`)
- **Response**: Updated session object

**Frontend Behavior**:
- Shows "Saving..." spinner on button
- On success:
  - Row background turns green
  - Button changes to "✓ Saved" (green checkmark)
  - Toast notification: "Hour X saved successfully ✓"
- Updates `savedSessions` Set to track saved hours

#### **Step 4: Finalize Day Attendance**

**Prerequisites**:
- At least 1 session must be saved
- Day attendance status must be DRAFT

**User Action**: Click "Finalize Day" button

**Backend Process**:
- **API**: `POST /api/attendance/day/finalize`
- **Request Body**:
  ```json
  {
    "dayAttendanceId": 123
  }
  ```
- **Validation**:
  - Checks day attendance exists
  - Checks status is DRAFT
  - Verifies at least 1 session exists
- **Database**: Updates `day_attendance.status = 'FINALIZED'`
- **Response**: Updated day attendance object

**Frontend Behavior**:
- All form fields become disabled (gray background)
- Status badge changes to: "✓ Finalized - Ready for Print"
- "Finalize Day" button disappears
- "Preview & Print" button becomes enabled

#### **Step 5: Preview & Print**

**User Action**: Click "Preview & Print" button (only enabled when FINALIZED)

**Navigation**: Redirects to `/preview?dayAttendanceId=123`

---

### **Phase 3: Preview Page** (`/preview`)

**Route**: `app/preview/page.tsx` → Renders `components/AttendancePreview.tsx`

#### **Step 1: Load Finalized Data**

**Backend Process**:
- **API**: `GET /api/attendance/day/{id}/print`
- **Validation**:
  - Checks day attendance exists
  - Verifies status is FINALIZED (403 if not)
- **Response**:
  ```json
  {
    "dayAttendance": {
      "id": 123,
      "date": "2025-01-29",
      "semester": 6,
      "classTeacherName": "Dr. John Doe",
      "total_students": 50,
      "status": "FINALIZED",
      ...
    },
    "sessions": [
      {
        "hour_no": 1,
        "room_no": "A101",
        "start_time": "09:00:00",
        "end_time": "10:00:00",
        "course_code": "CS301",
        "facultyName": "Dr. Jane Smith",
        "students_present": 45,
        "students_absent": 5,
        ...
      },
      ...
    ]
  }
  ```

**Frontend Behavior**:
- Shows loading indicator: "Loading finalized attendance data..."
- Populates form with all session data
- Displays success toast: "Finalized attendance data loaded (X sessions)"
- If no `dayAttendanceId` or not finalized → Redirects to `/form`

#### **Step 2: Print Preview**

**Features**:
- Displays formatted attendance report
- Print-optimized layout (A4 Landscape)
- All session details displayed in table format
- College header image
- Institution information

**Navigation Buttons**:
- **"Back to Edit"**: Links to `/form` (allows returning to form)
- **"Continue"**: Triggers browser print dialog

**Print Functionality**:
- Uses `react-to-print` library
- Sets print orientation to Landscape
- Hides navigation buttons in print view
- Optimized margins and fonts for A4 paper

---

## 🔐 Admin Workflow

### **Admin Login** (`/admin/login`)

**Route**: `app/admin/login/page.tsx`

**API**: `POST /api/auth/login`
- **Request**: `{ username, password }`
- **Response**: `{ success: true, user: { id, username } }`
- Sets HTTP-only cookie: `admin_token` (JWT, 7 days)

### **Admin Dashboard** (`/admin`)

**Route**: `app/admin/page.tsx` → Renders `components/AdminDashboard.tsx`

**Authentication Check**: `GET /api/auth/me`
- Validates JWT token from cookie
- Returns user info or 401

**Features**:
- **Teachers Management**: CRUD operations
  - `GET /api/admin/teachers`
  - `POST /api/admin/teachers`
  - `PUT /api/admin/teachers/[id]`
  - `DELETE /api/admin/teachers/[id]`
- **Courses Management**: CRUD operations
  - `GET /api/admin/courses`
  - `POST /api/admin/courses`
  - `PUT /api/admin/courses/[id]`
  - `DELETE /api/admin/courses/[id]`
- **Semesters Management**: CRUD operations
  - `GET /api/admin/semesters`
  - `POST /api/admin/semesters`
  - `PUT /api/admin/semesters`
- **Academic Year Management**:
  - `GET /api/admin/academic-year`
  - `POST /api/admin/academic-year`

---

## 📡 Complete API Endpoints Reference

### **Public APIs** (No Authentication Required)

#### **Data Fetching**
- `GET /api/courses?semester={number}` - Get all courses or filter by semester
- `GET /api/semesters?semester={number}` - Get all semesters or specific semester
- `GET /api/teachers?role={course_faculty|class_teacher}` - Get teachers by role
- `GET /api/academic-year` - Get current academic year

#### **Attendance APIs**
- `POST /api/attendance/day/get-or-create` - Get or create day attendance
- `GET /api/attendance/day/[id]` - Get day attendance by ID
- `POST /api/attendance/session/upsert` - Save/update session attendance
- `POST /api/attendance/day/finalize` - Finalize day attendance
- `GET /api/attendance/day/[id]/print` - Get print-ready finalized data

### **Admin APIs** (Authentication Required)

#### **Authentication**
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

#### **CRUD Operations**
- `GET /api/admin/teachers` - List all teachers
- `POST /api/admin/teachers` - Create teacher
- `PUT /api/admin/teachers/[id]` - Update teacher
- `DELETE /api/admin/teachers/[id]` - Delete teacher

- `GET /api/admin/courses` - List all courses
- `POST /api/admin/courses` - Create course
- `PUT /api/admin/courses/[id]` - Update course
- `DELETE /api/admin/courses/[id]` - Delete course

- `GET /api/admin/semesters` - List all semesters
- `POST /api/admin/semesters` - Create semester
- `PUT /api/admin/semesters` - Update semester

- `GET /api/admin/academic-year` - Get academic year
- `POST /api/admin/academic-year` - Set academic year

---

## 🗄️ Database Functions (`lib/db/index.ts`)

### **Course Functions**
- `getAllCourses()` - Get all courses
- `getCoursesBySemester(semester)` - Get courses for semester
- `getCourseByCode(code)` - Get course by code
- `getCourseByName(name)` - Get course by name
- `searchCourses(query)` - Search courses

### **Semester Functions**
- `getSemesterByNumber(semester)` - Get semester by number
- `getAllSemesters()` - Get all semesters

### **Teacher Functions**
- `getAllTeachers()` - Get all teachers
- `getCourseFaculty()` - Get teachers who can be course faculty
- `getClassTeachers()` - Get teachers who can be class teachers
- `getTeacherByName(name)` - Get teacher by name
- `getTeacherById(id)` - Get teacher by ID

### **Day Attendance Functions**
- `getOrCreateDayAttendance(params)` - Get existing or create new day attendance
- `getDayAttendanceById(id)` - Get day attendance with all sessions
- `finalizeDayAttendance(id)` - Set status to FINALIZED
- `getSessionsByDayAttendanceId(dayAttendanceId)` - Get all sessions for a day

### **Session Attendance Functions**
- `upsertSessionAttendance(params)` - Insert or update session (UPSERT)

---

## 🔒 Security & Authentication

### **JWT Authentication**
- **Secret**: `JWT_SECRET` environment variable
- **Token Storage**: HTTP-only cookie (`admin_token`)
- **Expiry**: 7 days
- **Middleware**: `lib/middleware.ts`
  - `isAuthenticated()` - Check if user is authenticated
  - `requireAuth()` - Require authentication (redirects if not)
  - `getCurrentUser()` - Get current user from token

### **Password Hashing**
- Uses `bcryptjs` library
- Salt rounds: 10

### **API Route Protection**
- Admin routes check authentication via `isAuthenticated()`
- Returns 401 if not authenticated
- Public routes have no authentication check

---

## 🎨 Frontend Components

### **Core Components**
- `components/AttendanceForm.tsx` - Main attendance form (session-by-session entry)
- `components/AttendancePreview.tsx` - Preview and print view
- `components/AdminDashboard.tsx` - Admin management interface
- `components/Toast.tsx` - Toast notification component

### **State Management**
- React hooks (`useState`, `useEffect`)
- React Hook Form for form state
- Session storage for temporary data persistence

### **Responsive Design**
- Tailwind CSS utility classes
- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`, `xl:`

---

## 🚀 Deployment (Vercel)

### **Environment Variables**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (production/development)

### **Build Process**
- Next.js builds static pages where possible
- API routes are serverless functions
- Database migrations run via npm scripts

### **Caching Strategy**
- API routes marked with `export const dynamic = 'force-dynamic'`
- Cache-Control headers set to prevent caching
- Query parameters for cache-busting (`_t`, `_r`)

---

## 📊 Data Flow Diagram

```
User → Landing Page (/)
  ↓
Attendance Form (/form)
  ↓
Select Date + Semester + Academic Year
  ↓
Auto-Load/Create Day Attendance (DRAFT)
  ↓
Fill Session Details (Hour 1-8)
  ↓
Save Each Session Individually
  ↓
Finalize Day Attendance (status = FINALIZED)
  ↓
Preview & Print (/preview?dayAttendanceId=X)
  ↓
Print Report
```

---

## 🔄 State Transitions

### **Day Attendance Status**
1. **DRAFT** → Created when form is opened
   - Can save/update sessions
   - Can add new sessions
   - Can edit existing sessions
2. **FINALIZED** → Set when "Finalize Day" is clicked
   - Cannot modify sessions
   - Cannot add new sessions
   - Can only view and print

### **Session States**
- **Unsaved**: White background, "Save" button enabled
- **Saving**: Loading spinner, button disabled
- **Saved**: Green background, "✓ Saved" indicator

---

## ✅ Validation Rules

### **Frontend Validation**
- End time > Start time (per session)
- Present count <= Total students (per session)
- Present count >= 0
- All required fields must be filled before saving

### **Backend Validation**
- Day attendance must exist before saving session
- Day attendance must be DRAFT to modify sessions
- At least 1 session required to finalize
- Unique constraint: (dayAttendanceId, hourNo) for sessions
- Unique constraint: (date, semester, department, program, academicYear, classTeacherId) for day attendance

---

## 🐛 Error Handling

### **Frontend**
- Toast notifications for all errors
- Loading states for async operations
- Form validation with error messages
- Graceful fallbacks for failed API calls

### **Backend**
- Try-catch blocks in all API routes
- Detailed error logging
- User-friendly error messages
- Proper HTTP status codes (400, 401, 403, 404, 500)

---

## 📝 Notes

- All dates stored in ISO format (YYYY-MM-DD)
- All times stored in TIME format (HH:MM:SS)
- Auto-calculation: `absent = totalStudents - present`
- Auto-calculation: `percentage = (present / totalStudents) * 100`
- Print orientation: Always Landscape (A4)
- Maximum sessions per day: 8 hours
