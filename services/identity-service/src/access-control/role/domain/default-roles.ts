import { SYSTEM_PERMISSIONS } from '../../permission/constants/permission-codes.constants.js'
import {
  appForModule,
  type PermissionApp,
} from '../../permission/domain/policies/permission-apps.policy.js'
import type { SystemPermission } from '../../permission/types/system-permission.type.js'
import { EMPLOYEE_SELF_SERVICE_PERMISSIONS } from './policies/structural-roles.policy.js'

export type Grant =
  | { app: PermissionApp }
  | { modules: string[] }
  | { codes: string[] }
  | { includes: string }
  | { everyRead: true }
  | { exceptModulePrefixes: string[] }

export interface DefaultRole {
  code: string
  name: string
  description: string
  structural: boolean
  grants: Grant[]
}

const STUDENT_LISTS = [
  'occupations',
  'educations',
  'income-ranges',
  'financing-sources',
  'disability-types',
  'special-needs',
  'student-residences',
  'parent-residences',
  'transportations',
  'travel-distances',
  'travel-times',
  'parent-life-statuses',
  'domiciles',
  'scholarship-categories',
  'scholarship-provider-types',
  'competition-fields',
  'competition-levels',
]

const TEACHER_CODES = (): string[] => [
  ...EMPLOYEE_SELF_SERVICE_PERMISSIONS,
  'dashboards.read-own',
  'teaching-assignments.read-own',
  'schedules.read-own',
  'attendances.read',
  'attendances.manage',
  'assessment-items.read',
  'assessment-items.create',
  'assessment-items.update',
  'assessment-items.delete',
  'student-scores.read',
  'student-scores.create',
  'student-scores.update',
  'student-scores.manage-assigned',
  'report-cards.read',
  'report-cards.create',
  'report-cards.publish',
  'announcements.read',
  'academic-calendars.read',
  'students.read',
  'academic-years.read',
  'classrooms.read',
  'subjects.read',
  'semesters.read',
  'enrollments.read',
  'time-slots.read',
  'religions.read',
  'blood-types.read',
  'educations.read',
  'income-ranges.read',
  'financing-sources.read',
  'disability-types.read',
  'special-needs.read',
  'student-residences.read',
  'parent-residences.read',
  'transportations.read',
  'travel-distances.read',
  'travel-times.read',
  'parent-life-statuses.read',
  'domiciles.read',
  'scholarship-categories.read',
  'scholarship-provider-types.read',
  'competition-fields.read',
  'competition-levels.read',
  'achievement-types.read',
]

const STUDENT_CODES = (): string[] => [
  'dashboards.read-own',
  'students.read-own',
  'attendances.read-own',
  'report-cards.read-own',
  'student-scores.read-own',
  'schedules.read-own',
  'announcements.read-own',
  'academic-calendars.read',
  'subjects.read',
  'classrooms.read-own',
  'time-slots.read',
  'religions.read',
  'blood-types.read',
]

const role = (
  code: string,
  name: string,
  description: string,
  grants: Grant[],
  structural = false,
): DefaultRole => ({ code, name, description, structural, grants })

export const DEFAULT_ROLES: DefaultRole[] = [
  role(
    'ACADEMIC_ADMIN',
    'Admin Akademik',
    'Mengelola seluruh aplikasi akademik',
    [{ app: 'academic' }],
  ),
  role(
    'ASSESSMENT_ADMIN',
    'Admin Penilaian',
    'Mengelola penilaian, nilai dan rapor',
    [
      {
        modules: [
          'assessment-items',
          'student-scores',
          'report-cards',
          'attendances',
        ],
      },
      {
        codes: [
          'classrooms.read',
          'subjects.read',
          'teaching-assignments.read',
          'students.read',
          'semesters.read',
          'academic-years.read',
          'curriculum-subjects.read',
        ],
      },
    ],
  ),
  role('ADMISSION_ADMIN', 'Admin PPDB', 'Mengelola seluruh aplikasi PPDB', [
    { app: 'admission' },
  ]),
  role('HR_ADMIN', 'Admin Kepegawaian', 'Mengelola data pegawai dan jabatan', [
    { app: 'hr' },
  ]),
  role(
    'PRESENCE_ADMIN',
    'Admin Presensi',
    'Mengelola presensi, perangkat dan cuti',
    [{ app: 'presence' }, { codes: ['employees.read'] }],
  ),
  role('PAYROLL_ADMIN', 'Admin Penggajian', 'Mengelola penggajian', [
    { app: 'payroll' },
    { codes: ['employees.read'] },
  ]),
  role(
    'INVENTORY_ADMIN',
    'Admin Inventaris',
    'Mengelola seluruh aplikasi inventaris',
    [{ app: 'inventory' }],
  ),
  role('PORTAL_ADMIN', 'Admin Portal', 'Mengelola website sekolah', [
    { app: 'portal' },
    { modules: ['files'] },
  ]),
  role(
    'SYSTEM_ADMIN',
    'Admin Sistem',
    'Mengelola pengguna, role dan pengaturan',
    [
      { modules: ['users', 'roles', 'school-units', 'sessions'] },
      {
        codes: [
          'permissions.manage',
          'settings.update',
          'audit-logs.read',
          'profiles.read',
        ],
      },
    ],
  ),
  role('OPERATOR', 'Operator', 'Operator sistem sekolah', [
    { exceptModulePrefixes: ['portal-', 'payroll-'] },
  ]),
  role(
    'PRINCIPAL',
    'Kepala Madrasah',
    'Melihat semua data dan memberi persetujuan',
    [
      { everyRead: true },
      {
        codes: [
          'dashboards.read',
          'leave-requests.approve',
          'payroll-runs.approve',
          'inventory-approvals.update',
          'report-cards.publish',
          'admissions.decide',
          'admission-decisions.decide',
        ],
      },
    ],
  ),
  role(
    'CURRICULUM_STAFF',
    'TU Administrasi',
    'Administrasi kelas, rombel dan kalender',
    [
      { modules: ['classrooms', 'enrollments'] },
      {
        codes: [
          'academic-calendars.read',
          'academic-calendars.create',
          'academic-calendars.update',
          'schedules.read',
          'teaching-assignments.read',
          'report-cards.read',
          'students.read',
          'subjects.read',
          'semesters.read',
          'academic-years.read',
          'time-slots.read',
        ],
      },
    ],
  ),
  role(
    'VICE_PRINCIPAL_CURRICULUM',
    'Wakamad Kurikulum',
    'Kurikulum, jadwal dan rapor',
    [
      { includes: 'CURRICULUM_STAFF' },
      {
        modules: [
          'curricula',
          'curriculum-subjects',
          'subjects',
          'schedules',
          'time-slots',
          'semesters',
          'academic-years',
          'academic-calendars',
          'academic-calendar-types',
          'academic-settings',
          'teaching-assignments',
        ],
      },
      {
        codes: [
          'report-cards.publish',
          'student-scores.read',
          'assessment-items.read',
          'admissions.read',
          'admission-decisions.read',
          'admission-decisions.decide',
        ],
      },
    ],
  ),
  role('STUDENT_AFFAIRS_STAFF', 'TU Kesantrian', 'Data santri dan PPDB', [
    {
      codes: [
        'students.read',
        'students.create',
        'students.update',
        'parents.read',
        'parents.create',
        'parents.update',
        'achievements.read',
        'achievements.create',
        'achievements.update',
        'scholarships.read',
        'scholarships.create',
        'scholarships.update',
        'attendances.read',
        'classrooms.read',
        'enrollments.read',
        'admissions.read',
        'admissions.create',
        'admissions.verify',
        'admission-documents.read',
        'admission-documents.verify',
        'admissions.enroll',
        'admission-enrolments.read',
        'admission-enrolments.process',
        'admission-enrolments.nis',
        'admission-waves.read',
        'admission-bank-accounts.read',
        'admission-document-types.read',
        'admission-downloads.read',
        'admission-payments.read',
      ],
    },
    { modules: ['admission-announcements'] },
  ]),
  role(
    'VICE_PRINCIPAL_STUDENT_AFFAIRS',
    'Wakamad Kesantrian',
    'Kesantrian, kelulusan dan keputusan PPDB',
    [
      { includes: 'STUDENT_AFFAIRS_STAFF' },
      {
        modules: [
          'students',
          'parents',
          'attendances',
          'graduations',
          'achievements',
          'achievement-types',
          'scholarships',
          ...STUDENT_LISTS,
        ],
      },
      {
        codes: [
          'admissions.decide',
          'admission-decisions.read',
          'admission-decisions.decide',
        ],
      },
    ],
  ),
  role(
    'HEAD_OF_ADMINISTRATION',
    'Kepala TU',
    'Kepegawaian dan pengaturan presensi',
    [
      {
        modules: [
          'employees',
          'positions',
          'employment-types',
          'work-patterns',
          'non-working-days',
          'leave-types',
        ],
      },
      {
        codes: [
          'leave-requests.read',
          'leave-requests.approve',
          'presence-records.read',
          'admissions.read',
          'inventory-assets.read',
          'inventory-loans.read',
        ],
      },
    ],
  ),
  role('FINANCE_STAFF', 'TU Keuangan', 'Menyiapkan penggajian', [
    {
      codes: [
        'payroll-components.read',
        'payroll-salaries.read',
        'payroll-salaries.update',
        'payroll-runs.read',
        'payroll-runs.create',
        'payroll-runs.update',
        'payroll-payslips.read',
        'employees.read',
        'admissions.read',
      ],
    },
  ]),
  role('TREASURER', 'Bendahara', 'Penggajian dan verifikasi pembayaran PPDB', [
    { includes: 'FINANCE_STAFF' },
    {
      modules: [
        'payroll-components',
        'payroll-salaries',
        'admission-bank-accounts',
        'admission-payments',
      ],
    },
    {
      codes: [
        'payroll-runs.approve',
        'presence-periods.close',
        'admission-waves.read',
      ],
    },
  ]),
  role('PUBLIC_RELATIONS', 'Humas', 'Website dan pengumuman sekolah', [
    { app: 'portal' },
    { modules: ['files', 'announcements'] },
  ]),
  role(
    'HOMEROOM_TEACHER',
    'Wali Kelas',
    'Kehadiran dan rapor kelas perwalian',
    [
      {
        codes: [
          'attendances.read',
          'attendances.update',
          'attendances.manage',
          'report-cards.read',
          'report-cards.create',
          'report-cards.update',
          'students.read',
          'parents.read',
          'student-scores.read',
          'classrooms.read',
        ],
      },
    ],
  ),
  role('PARENT', 'Orang Tua', 'Orang tua atau wali siswa', []),
  role(
    'EMPLOYEE',
    'Pegawai',
    'Akses mandiri pegawai',
    [{ codes: [...EMPLOYEE_SELF_SERVICE_PERMISSIONS] }],
    true,
  ),
  role(
    'TEACHER',
    'Guru',
    'Institution Teacher',
    [{ codes: TEACHER_CODES() }],
    true,
  ),
  role(
    'STUDENT',
    'Siswa',
    'Institution Student',
    [{ codes: STUDENT_CODES() }],
    true,
  ),
  role(
    'APPLICANT',
    'Pendaftar',
    'Admission Applicant',
    [{ codes: ['admissions.apply'] }],
    true,
  ),
]

const EXPLICIT_ONLY = new Set([
  'admissions.apply',
  'admission-decisions.decide',
  'admission-enrolments.process',
  'admission-enrolments.nis',
])

function broad(catalogue: SystemPermission[]): SystemPermission[] {
  return catalogue.filter((p) => !EXPLICIT_ONLY.has(p.code))
}

function selected(grant: Grant, catalogue: SystemPermission[]): string[] {
  if ('app' in grant) {
    return broad(catalogue)
      .filter((p) => appForModule(p.module) === grant.app)
      .map((p) => p.code)
  }
  if ('modules' in grant) {
    return grant.modules.flatMap((module) => {
      const codes = broad(catalogue)
        .filter((p) => p.module === module)
        .map((p) => p.code)
      if (codes.length === 0) throw new Error(`Unknown module ${module}`)
      return codes
    })
  }
  if ('codes' in grant) {
    const known = new Set(catalogue.map((p) => p.code))
    for (const code of grant.codes) {
      if (!known.has(code)) throw new Error(`Unknown permission ${code}`)
    }
    return grant.codes
  }
  if ('includes' in grant) return resolveGrants(grant.includes, catalogue)
  if ('everyRead' in grant) {
    return catalogue.filter((p) => p.action === 'read').map((p) => p.code)
  }
  return broad(catalogue)
    .filter(
      (p) =>
        !grant.exceptModulePrefixes.some((prefix) =>
          p.module.startsWith(prefix),
        ),
    )
    .map((p) => p.code)
}

export function resolveGrants(
  code: string,
  catalogue: SystemPermission[] = SYSTEM_PERMISSIONS,
): string[] {
  const role = DEFAULT_ROLES.find((candidate) => candidate.code === code)
  if (!role) throw new Error(`Unknown default role ${code}`)
  return [
    ...new Set(role.grants.flatMap((grant) => selected(grant, catalogue))),
  ].sort()
}

export function defaultRoleGrantsFor(
  newCodes: ReadonlySet<string>,
): { roleCode: string; codes: string[] }[] {
  if (newCodes.size === 0) return []
  return DEFAULT_ROLES.map((role) => ({
    roleCode: role.code,
    codes: resolveGrants(role.code).filter((code) => newCodes.has(code)),
  })).filter((grant) => grant.codes.length > 0)
}
