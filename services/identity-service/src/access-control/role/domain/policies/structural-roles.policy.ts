export interface StructuralRole {
  code: string
  name: string
  description: string
  requiredBy: string
}

export const EMPLOYEE_SELF_SERVICE_PERMISSIONS = [
  'employees.read-own',
  'leave-requests.create',
  'leave-requests.read-own',
  'payroll-payslips.read-own',
  'presence-records.read-own',
] as const

export const STRUCTURAL_ROLES: StructuralRole[] = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Platform Super Admin',
    requiredBy: 'PermissionGuard — the break-glass bypass',
  },
  {
    code: 'EMPLOYEE',
    name: 'Pegawai',
    description: 'Employee self-service access',
    requiredBy:
      'Cross-service — hr-service: prisma-employee.repository.ts (provisioning employee accounts)',
  },
  {
    code: 'TEACHER',
    name: 'Guru',
    description: 'Institution Teacher',
    requiredBy:
      'Cross-service — academic-service: prisma-teacher.writer.ts (provisioning a teacher account)',
  },
  {
    code: 'STUDENT',
    name: 'Siswa',
    description: 'Institution Student',
    requiredBy:
      'Cross-service — academic-service: prisma-student.writer.ts; admission-service: prisma-admission-application.repository.ts',
  },
  {
    code: 'APPLICANT',
    name: 'Pendaftar',
    description: 'Admission Applicant',
    requiredBy:
      'Cross-service — admission-service: prisma-admission-applicant.repository.ts (registration)',
  },
]

const STRUCTURAL_CODES = new Set(STRUCTURAL_ROLES.map((role) => role.code))

export function isStructuralRole(code: string): boolean {
  return STRUCTURAL_CODES.has(code)
}
