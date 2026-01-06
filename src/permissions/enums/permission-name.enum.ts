/**
 * Enum para nomes de permissões do sistema
 * Usa formato module:action (ex: 'student:create')
 */
export enum PermissionName {
  // Wildcard
  ALL = '*:*',

  // Student permissions
  STUDENT_CREATE = 'student:create',
  STUDENT_READ = 'student:read',
  STUDENT_UPDATE = 'student:update',
  STUDENT_DELETE = 'student:delete',

  // Financial permissions
  FINANCIAL_CREATE = 'financial:create',
  FINANCIAL_READ = 'financial:read',
  FINANCIAL_UPDATE = 'financial:update',
  FINANCIAL_DELETE = 'financial:delete',

  // Attendance permissions
  ATTENDANCE_CREATE = 'attendance:create',
  ATTENDANCE_READ = 'attendance:read',
  ATTENDANCE_UPDATE = 'attendance:update',
  ATTENDANCE_DELETE = 'attendance:delete',

  // Grade permissions
  GRADE_CREATE = 'grade:create',
  GRADE_READ = 'grade:read',
  GRADE_UPDATE = 'grade:update',
  GRADE_DELETE = 'grade:delete',

  // Class permissions
  CLASS_CREATE = 'class:create',
  CLASS_READ = 'class:read',
  CLASS_UPDATE = 'class:update',
  CLASS_DELETE = 'class:delete',

  // User permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Webhook permissions
  WEBHOOK_CREATE = 'webhook:create',
  WEBHOOK_READ = 'webhook:read',
  WEBHOOK_UPDATE = 'webhook:update',
  WEBHOOK_DELETE = 'webhook:delete',

  // Document permissions
  DOCUMENT_CREATE = 'document:create',
  DOCUMENT_READ = 'document:read',
  DOCUMENT_UPDATE = 'document:update',
  DOCUMENT_DELETE = 'document:delete',

  // School Year permissions
  SCHOOL_YEAR_CREATE = 'school-year:create',
  SCHOOL_YEAR_READ = 'school-year:read',
  SCHOOL_YEAR_UPDATE = 'school-year:update',
  SCHOOL_YEAR_DELETE = 'school-year:delete',

  // School Calendar permissions
  SCHOOL_CALENDAR_CREATE = 'school-calendar:create',
  SCHOOL_CALENDAR_READ = 'school-calendar:read',
  SCHOOL_CALENDAR_UPDATE = 'school-calendar:update',
  SCHOOL_CALENDAR_DELETE = 'school-calendar:delete',

  // Class Schedule permissions
  CLASS_SCHEDULE_CREATE = 'class-schedule:create',
  CLASS_SCHEDULE_READ = 'class-schedule:read',
  CLASS_SCHEDULE_UPDATE = 'class-schedule:update',
  CLASS_SCHEDULE_DELETE = 'class-schedule:delete',

  // Report Financial permissions
  REPORT_FINANCIAL_CREATE = 'report-financial:create',
  REPORT_FINANCIAL_READ = 'report-financial:read',

  // Class Note permissions
  CLASS_NOTE_CREATE = 'class-note:create',
  CLASS_NOTE_READ = 'class-note:read',
  CLASS_NOTE_UPDATE = 'class-note:update',
  CLASS_NOTE_DELETE = 'class-note:delete',

  // Enrollment permissions
  ENROLLMENT_CREATE = 'enrollment:create',
  ENROLLMENT_READ = 'enrollment:read',
  ENROLLMENT_UPDATE = 'enrollment:update',
  ENROLLMENT_DELETE = 'enrollment:delete',

  // Guardian permissions
  GUARDIAN_CREATE = 'guardian:create',
  GUARDIAN_READ = 'guardian:read',
  GUARDIAN_UPDATE = 'guardian:update',
  GUARDIAN_DELETE = 'guardian:delete',

  // Employee permissions
  EMPLOYEE_CREATE = 'employee:create',
  EMPLOYEE_READ = 'employee:read',
  EMPLOYEE_UPDATE = 'employee:update',
  EMPLOYEE_DELETE = 'employee:delete',

  // Subject permissions
  SUBJECT_CREATE = 'subject:create',
  SUBJECT_READ = 'subject:read',
  SUBJECT_UPDATE = 'subject:update',
  SUBJECT_DELETE = 'subject:delete',

  // School Config permissions
  SCHOOL_CONFIG_CREATE = 'school-config:create',
  SCHOOL_CONFIG_READ = 'school-config:read',
  SCHOOL_CONFIG_UPDATE = 'school-config:update',
  SCHOOL_CONFIG_DELETE = 'school-config:delete',

  // Financial Product permissions
  FINANCIAL_PRODUCT_CREATE = 'financial-product:create',
  FINANCIAL_PRODUCT_READ = 'financial-product:read',
  FINANCIAL_PRODUCT_UPDATE = 'financial-product:update',
  FINANCIAL_PRODUCT_DELETE = 'financial-product:delete',

  // Teacher permissions
  TEACHER_CREATE = 'teacher:create',
  TEACHER_READ = 'teacher:read',
  TEACHER_UPDATE = 'teacher:update',
  TEACHER_DELETE = 'teacher:delete',

  // Audit permissions
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
}
