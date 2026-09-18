export type PermissionApp =
  | 'academic'
  | 'platform'
  | 'portal'
  | 'admission'
  | 'inventory'
  | 'presence'
  | 'hr'
  | 'payroll'

export const PERMISSION_APPS: { key: PermissionApp; label: string }[] = [
  { key: 'academic', label: 'Akademik' },
  { key: 'presence', label: 'Presensi' },
  { key: 'hr', label: 'Kepegawaian' },
  { key: 'payroll', label: 'Penggajian' },
  { key: 'admission', label: 'PPDB' },
  { key: 'inventory', label: 'Inventaris' },
  { key: 'portal', label: 'Portal' },
  { key: 'platform', label: 'Sistem' },
]

const MODULE_APP: Record<string, PermissionApp> = {
  'academic-calendar-types': 'academic',
  'academic-calendars': 'academic',
  'academic-settings': 'academic',
  'academic-years': 'academic',
  'assessment-items': 'academic',
  attendances: 'academic',
  classrooms: 'academic',
  curricula: 'academic',
  'curriculum-subjects': 'academic',
  enrollments: 'academic',
  graduations: 'academic',
  occupations: 'academic',
  parents: 'academic',
  'report-cards': 'academic',
  schedules: 'academic',
  semesters: 'academic',
  'student-scores': 'academic',
  students: 'academic',
  subjects: 'academic',
  'teaching-assignments': 'academic',
  'time-slots': 'academic',

  'leave-requests': 'presence',
  'leave-types': 'presence',
  'non-working-days': 'presence',
  'work-patterns': 'presence',
  'presence-credentials': 'presence',
  'presence-devices': 'presence',
  'presence-periods': 'presence',
  'presence-records': 'presence',
  'presence-scans': 'presence',

  employees: 'hr',
  'employment-types': 'hr',
  positions: 'hr',

  'payroll-components': 'payroll',
  'payroll-payslips': 'payroll',
  'payroll-runs': 'payroll',
  'payroll-salaries': 'payroll',

  'admission-announcements': 'admission',
  'admission-waves': 'admission',
  admissions: 'admission',

  'inventory-approvals': 'inventory',
  'inventory-assets': 'inventory',
  'inventory-loans': 'inventory',
  'inventory-reference-data': 'inventory',

  'portal-agendas': 'portal',
  'portal-albums': 'portal',
  'portal-categories': 'portal',
  'portal-pages': 'portal',
  'portal-posts': 'portal',
  'portal-settings': 'portal',
  'portal-tags': 'portal',

  'achievement-types': 'platform',
  achievements: 'platform',
  announcements: 'platform',
  'audit-logs': 'platform',
  'blood-types': 'platform',
  dashboards: 'platform',
  'educational-histories': 'platform',
  educations: 'platform',
  files: 'platform',
  permissions: 'platform',
  profiles: 'platform',
  religions: 'platform',
  roles: 'platform',
  scholarships: 'platform',
  'school-units': 'platform',
  sessions: 'platform',
  settings: 'platform',
  'social-media': 'platform',
  users: 'platform',
}

export function appForModule(module: string): PermissionApp {
  return MODULE_APP[module] ?? 'platform'
}

export function isModuleClassified(module: string): boolean {
  return module in MODULE_APP
}

export function classifiedModules(): string[] {
  return Object.keys(MODULE_APP)
}
