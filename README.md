# Attendify - Day-Wise Attendance Report System

A modern, interactive web application for digitizing and managing day-wise attendance reports for colleges. Built with Next.js, TypeScript, and Tailwind CSS, this application provides a seamless experience for faculty to create, edit, and print official attendance reports.

## 📋 Overview

Attendify is a production-ready attendance management system that allows faculty members to:
- Fill out attendance reports directly on a printable document interface
- Auto-populate fields based on selections (semester, course, etc.)
- Preview and print reports in professional A4 format (landscape/portrait)
- Automatically calculate attendance percentages and absent counts
- Save work progress automatically using browser session storage

## ✨ Key Features

### 🎯 Core Functionality
- **Interactive Editable Preview**: Users interact directly with the printable document - no separate form page needed
- **Auto-Population**: Smart field mapping based on selections:
  - Class Teacher auto-filled based on semester
  - Course Code ↔ Course Title bidirectional mapping
  - Total Students auto-filled based on semester (editable)
  - Academic Year dropdown with current year and surrounding ranges
- **Real-time Calculations**: 
  - Absent students = Total - Present
  - Attendance percentage = (Present / Total) × 100 (rounded to 2 decimals, clamped 0-100)
- **Time Formatting**: 12-hour format with AM/PM display
- **Date Formatting**: DD/MM/YYYY format with day name

### 🎨 User Experience
- **Single-Page Workflow**: Direct access to editable preview page
- **Auto-Save**: Form data automatically saved to sessionStorage as user types
- **Print Options**: Choose between Portrait or Landscape orientation before printing
- **Error Handling**: Robust validation and user-friendly error messages
- **Loading States**: Smooth loading indicators and transitions
- **Toast Notifications**: Success and error messages

### 📄 Print Features
- **A4 Format**: Optimized for A4 paper size (landscape recommended)
- **Single Page Fit**: All content fits on one page with optimized spacing
- **Professional Layout**: Clean, official document styling
- **College Header**: Centered college header image at top
- **Print-Specific Styling**: Hidden UI elements, optimized fonts and spacing

### 🔧 Technical Features
- **TypeScript**: Full type safety throughout the application
- **Form Validation**: Comprehensive validation using React Hook Form
- **Time Range Validation**: End time must be after start time
- **Accessibility**: ARIA labels, keyboard navigation, high contrast
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Form Management**: React Hook Form
- **Printing**: react-to-print
- **State Management**: Client-side (sessionStorage)

## 📁 Project Structure

```
Project/
├── app/
│   ├── page.tsx              # Landing page (redirects to /preview)
│   ├── preview/
│   │   └── page.tsx          # Preview page wrapper
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles + print styles
├── components/
│   ├── AttendancePreview.tsx # Main editable preview component
│   ├── AttendanceForm.tsx    # Legacy form component (not used)
│   └── Toast.tsx             # Toast notification component
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   └── utils.ts              # Utility functions (formatting, calculations, mappings)
├── public/
│   └── CollegeHeader.jpeg    # College header image
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd Project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)
   - The app will automatically redirect to `/preview` (the editable form)

### Build for Production

```bash
npm run build
npm start
```

## 📝 Usage Guide

### Creating an Attendance Report

1. **Access the Application**
   - Open the app in your browser
   - You'll be taken directly to the editable preview page

2. **Fill in Report Details**
   - **Program**: Fixed as "Bachelor in Engineering"
   - **Department**: Fixed as "Computer Science and Design"
   - **Academic Year**: Select from dropdown (e.g., 2025-26, 2026-27)
   - **Semester**: Select semester (1st-8th)
     - Class Teacher and Total Students auto-populate
   - **Date**: Select date using date picker
   - **Course Title/Course Code**: Select either - the other auto-populates
   - **Course Faculty**: Select from dropdown
   - **Total Students**: Auto-filled but editable

3. **Fill Hour Table**
   - Enter Room Number, Start Time, and End Time for each hour
   - Start/End times display in 12-hour format (e.g., "11:11 AM")
   - End time must be after start time (validated)
   - Course Code and Faculty auto-populate for first hour

4. **Enter Attendance**
   - **Total No. of Students Present**: Enter number
   - **Total No. of Students Absent**: Auto-calculated
   - **Percentage of Attendance**: Auto-calculated

5. **Add Remarks** (Optional)
   - Enter remarks by HOD in the textarea

6. **Print the Report**
   - Click "Print Report" button
   - Choose orientation (Landscape recommended)
   - Print dialog opens with formatted document

### Data Persistence

- All form data is automatically saved to `sessionStorage` as you type
- Data persists when refreshing the page
- Data is cleared when browser session ends

## 🎨 Form Fields

### Fixed Fields
- **Program**: "Bachelor in Engineering" (read-only)
- **Department**: "Computer Science and Design" (read-only)

### Auto-Populated Fields
- **Class Teacher**: Based on selected semester
- **Total Students**: Based on selected semester (editable)
- **Course Code/Title**: Bidirectional mapping
- **Absent Students**: Calculated from Total - Present
- **Percentage**: Calculated from (Present / Total) × 100

### Editable Fields
- Academic Year, Semester, Date
- Course Title, Course Code, Course Faculty
- Total Students (auto-filled but editable)
- Hour table (Room, Start Time, End Time)
- Total Present Students
- Remarks

## 🔍 Key Components

### AttendancePreview
The main component that renders the editable form. Features:
- React Hook Form integration for form state
- Auto-save to sessionStorage
- Print functionality with orientation selection
- Real-time calculations
- Validation and error handling

### Utility Functions (`lib/utils.ts`)
- `formatDateAcademic()`: Formats date to DD/MM/YYYY
- `getDayName()`: Gets day name from date
- `formatTimeAcademic()`: Formats time to HH:MM AM/PM
- `calculateAbsent()`: Calculates absent students
- `calculatePercentage()`: Calculates attendance percentage
- `validateTimeRange()`: Validates end time is after start time
- `getAcademicYearOptions()`: Generates academic year options
- `getClassTeacherBySemester()`: Maps semester to class teacher
- `getTotalStudentsBySemester()`: Maps semester to total students
- `getCourseByCode()` / `getCourseByTitle()`: Course mapping
- `validateReportData()`: Validates report data structure

## 🎯 Design Principles

- **Official Document Look**: Clean, professional styling matching academic forms
- **Single Page Experience**: No navigation between form and preview
- **Auto-Save**: No manual save needed - data persists automatically
- **Print-Optimized**: Everything fits on one A4 page
- **Accessible**: Keyboard navigation, ARIA labels, high contrast
- **Type-Safe**: Full TypeScript coverage

## 📱 Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

## 🔒 Data Storage

- **Storage Method**: Browser `sessionStorage`
- **Persistence**: Data persists during browser session
- **Scope**: Per-tab/window
- **Clearance**: Data cleared when tab/window closes

## 🐛 Known Limitations

- Data is stored in sessionStorage (cleared when browser closes)
- Mock data for courses, faculty, and class teachers (can be replaced with API calls)
- Print orientation must be selected each time (not saved)

## 🚧 Future Enhancements

Potential improvements:
- Backend API integration for data persistence
- User authentication
- Multiple report templates
- Export to PDF without print dialog
- Report history and management
- Multi-user support
- Database integration

## 📄 License

This project is private and proprietary.

## 👥 Development

Built with modern web technologies following best practices:
- TypeScript for type safety
- React Hook Form for efficient form handling
- Tailwind CSS for responsive styling
- Next.js for optimal performance

---

**Version**: 0.1.0  
**Last Updated**: 2025

