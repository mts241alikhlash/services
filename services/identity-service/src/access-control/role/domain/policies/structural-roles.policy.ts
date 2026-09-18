export interface StructuralRole {
  code: string
  name: string
  description: string
  requiredBy: string
}

export const STRUCTURAL_ROLES: StructuralRole[] = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Platform Super Admin',
    requiredBy: 'PermissionGuard — the break-glass bypass',
  },
  {
    code: 'ADMIN',
    name: 'Administrator',
    description: 'Institution Administrator',
    requiredBy: 'No code path — the school-wide administrator role',
  },
  {
    code: 'TEACHER',
    name: 'Teacher',
    description: 'Institution Teacher',
    requiredBy:
      'Cross-service — academic-service: prisma-teacher.writer.ts (provisioning a teacher account)',
  },
  {
    code: 'STUDENT',
    name: 'Student',
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
