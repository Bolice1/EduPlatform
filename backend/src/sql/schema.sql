-- Multi-tenant schema for Gishoma School Management System

SET FOREIGN_KEY_CHECKS = 0;

-- Schools (tenant root)
CREATE TABLE IF NOT EXISTS schools (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  region VARCHAR(100),
  subscription_tier ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
  subscription_expires_at DATE,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_schools_slug (slug),
  INDEX idx_schools_active (is_active)
);

-- Users (global - linked to school for non-super-admins)
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36),
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('super_admin', 'school_admin', 'bursar', 'dean', 'teacher', 'student') NOT NULL,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_school_email (school_id, email),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  INDEX idx_users_school (school_id),
  INDEX idx_users_role (role),
  INDEX idx_users_email (email)
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_expires (expires_at)
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36),
  school_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id VARCHAR(36),
  details JSON,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  INDEX idx_activity_user (user_id),
  INDEX idx_activity_school (school_id),
  INDEX idx_activity_created (created_at)
);

-- Students (per school)
CREATE TABLE IF NOT EXISTS students (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  student_id VARCHAR(50) NOT NULL,
  class_level VARCHAR(50) NOT NULL,
  section VARCHAR(20),
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  parent_name VARCHAR(255),
  parent_phone VARCHAR(50),
  address TEXT,
  is_prefect ENUM('head_boy', 'head_girl') NULL,
  enrollment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_students_school_no (school_id, student_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_students_school (school_id),
  INDEX idx_students_class (school_id, class_level)
);

-- Teachers (per school)
CREATE TABLE IF NOT EXISTS teachers (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  employee_id VARCHAR(50) NOT NULL,
  specialization VARCHAR(100),
  date_of_birth DATE,
  gender ENUM('male', 'female', 'other'),
  hire_date DATE,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_teachers_school_emp (school_id, employee_id),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_teachers_school (school_id)
);

-- Courses (per school)
CREATE TABLE IF NOT EXISTS courses (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  class_level VARCHAR(50),
  credits INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_courses_school_code (school_id, code),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_courses_school (school_id)
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  status ENUM('active', 'completed', 'withdrawn') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uk_enrollment (student_id, course_id, academic_year),
  INDEX idx_enrollments_school (school_id)
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36),
  teacher_id CHAR(36),
  course_id CHAR(36),
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
  type ENUM('student', 'teacher') NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  INDEX idx_attendance_school_date (school_id, date),
  INDEX idx_attendance_student (student_id),
  INDEX idx_attendance_teacher (teacher_id)
);

-- Marks
CREATE TABLE IF NOT EXISTS marks (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  teacher_id CHAR(36),
  term VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  exam_type ENUM('midterm', 'final', 'assignment', 'quiz'),
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) DEFAULT 100,
  remarks TEXT,
  removed BOOLEAN DEFAULT FALSE,
  removal_reason TEXT,
  removed_by CHAR(36),
  removed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (removed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_marks_school (school_id),
  INDEX idx_marks_student (student_id)
);

-- Discipline
CREATE TABLE IF NOT EXISTS disciplines (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL,
  type ENUM('warning', 'reprimand', 'suspension', 'expulsion', 'other') NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  resolution TEXT,
  status ENUM('open', 'resolved', 'closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_disciplines_school (school_id)
);

-- Homework
CREATE TABLE IF NOT EXISTS homework (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATETIME NOT NULL,
  max_score DECIMAL(5,2) DEFAULT 100,
  attachments JSON,
  status ENUM('draft', 'published', 'closed') DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_homework_school (school_id)
);

-- Homework submissions
CREATE TABLE IF NOT EXISTS homework_submissions (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  homework_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  content TEXT,
  attachments JSON,
  score DECIMAL(5,2),
  submitted_at DATETIME NOT NULL,
  feedback TEXT,
  status ENUM('submitted', 'graded', 'late') DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_hw_sub_school (school_id)
);

-- Exercises
CREATE TABLE IF NOT EXISTS exercises (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  questions JSON NOT NULL,
  due_date DATETIME,
  max_score DECIMAL(5,2) DEFAULT 100,
  time_limit_minutes INT,
  status ENUM('draft', 'active', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_exercises_school (school_id)
);

-- Exercise submissions
CREATE TABLE IF NOT EXISTS exercise_submissions (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  exercise_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  answers JSON,
  score DECIMAL(5,2),
  submitted_at DATETIME NOT NULL,
  time_spent_minutes INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_ex_sub_school (school_id)
);

-- Notes
-- Timetables / Schedule
CREATE TABLE IF NOT EXISTS timetables (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NULL,
  class_level VARCHAR(50) NOT NULL,
  section VARCHAR(10) DEFAULT 'A',
  day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50) NULL,
  academic_year VARCHAR(10) NOT NULL,
  term VARCHAR(20) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_timetable_school (school_id),
  INDEX idx_timetable_class (class_level),
  INDEX idx_timetable_day (day_of_week)
);

CREATE TABLE IF NOT EXISTS notes (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  course_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  topic VARCHAR(100),
  attachments JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_notes_school (school_id)
);

-- Fees
CREATE TABLE IF NOT EXISTS fees (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  term VARCHAR(50),
  academic_year VARCHAR(20) NOT NULL,
  due_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  INDEX idx_fees_school (school_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  fee_id CHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  receipt_number VARCHAR(100) UNIQUE,
  payment_method ENUM('cash', 'bank', 'mobile_money', 'check', 'other') DEFAULT 'cash',
  payment_date DATETIME NOT NULL,
  reference VARCHAR(255),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_id) REFERENCES fees(id) ON DELETE CASCADE,
  INDEX idx_payments_school (school_id),
  INDEX idx_payments_date (payment_date)
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id CHAR(36),
  target_role ENUM('all', 'students', 'teachers', 'school_admin', 'super_admin') DEFAULT 'all',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_announcements_school (school_id)
);

-- ===== SECURITY TABLES =====

-- Blacklisted/revoked tokens (logout, password reset, etc.)
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token LONGTEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_expires (expires_at)
);

-- Login attempt tracking for brute force protection
CREATE TABLE IF NOT EXISTS login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  success TINYINT(1) DEFAULT 0,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_time (email, attempted_at)
);

-- Account lockouts after failed login attempts
CREATE TABLE IF NOT EXISTS account_lockouts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  locked_until DATETIME NOT NULL,
  reason VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_locked (user_id, locked_until)
);

-- Security events (suspicious activity, access logs, etc.)
CREATE TABLE IF NOT EXISTS security_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id CHAR(36) NULL,
  user_id CHAR(36) NULL,
  event_type VARCHAR(100) NOT NULL,
  severity ENUM('low','medium','high','critical') DEFAULT 'low',
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_school (school_id),
  INDEX idx_severity (severity),
  INDEX idx_created (created_at)
);

SET FOREIGN_KEY_CHECKS = 1;
