import { SYSTEM_PERMISSIONS } from '../../permission/constants/permission-codes.constants.js'
import { DEFAULT_ROLES, resolveGrants } from './default-roles.js'
import { STRUCTURAL_ROLES } from './policies/structural-roles.policy.js'

const codesOf = (role: string) => new Set(resolveGrants(role))
const contains = (outer: string, inner: string) =>
  [...codesOf(inner)].every((code) => codesOf(outer).has(code))

describe('default roles', () => {
  it('resolves every role against the catalog', () => {
    for (const role of DEFAULT_ROLES) {
      expect(() => resolveGrants(role.code)).not.toThrow()
    }
  })

  it('defines the default roles and four structural grants', () => {
    expect(DEFAULT_ROLES.filter((role) => !role.structural)).toHaveLength(21)
    expect(
      DEFAULT_ROLES.filter((role) => role.structural)
        .map((role) => role.code)
        .sort(),
    ).toEqual(['APPLICANT', 'EMPLOYEE', 'STUDENT', 'TEACHER'])
  })

  it('uses unique English codes', () => {
    const codes = DEFAULT_ROLES.map((role) => role.code)
    expect(new Set(codes).size).toBe(codes.length)
    for (const code of codes) expect(code).toMatch(/^[A-Z][A-Z_]+$/)
  })

  it('gives each superior every permission of the staff below it', () => {
    expect(contains('TREASURER', 'FINANCE_STAFF')).toBe(true)
    expect(contains('VICE_PRINCIPAL_CURRICULUM', 'CURRICULUM_STAFF')).toBe(true)
    expect(
      contains('VICE_PRINCIPAL_STUDENT_AFFAIRS', 'STUDENT_AFFAIRS_STAFF'),
    ).toBe(true)
  })

  it('limits EMPLOYEE to self-service permissions', () => {
    expect(resolveGrants('EMPLOYEE')).toEqual([
      'employees.read-own',
      'leave-requests.create',
      'leave-requests.read-own',
      'payroll-payslips.read-own',
      'presence-records.read-own',
    ])
  })

  it('includes employee self-service grants in TEACHER defaults', () => {
    expect(contains('TEACHER', 'EMPLOYEE')).toBe(true)
  })

  it('keeps the operator out of portal and payroll', () => {
    expect(
      [...codesOf('OPERATOR')].filter(
        (code) => code.startsWith('portal-') || code.startsWith('payroll-'),
      ),
    ).toEqual([])
  })

  it('lets the principal read and approve but never change data', () => {
    const changing = [...codesOf('PRINCIPAL')].filter((code) =>
      /\.(create|update|delete)$/.test(code),
    )
    expect(changing).toEqual(['inventory-approvals.update'])
    expect(codesOf('PRINCIPAL').has('payroll-runs.approve')).toBe(true)
  })

  it('lets TU Kesantrian and the deputy for student affairs enroll and number students, and others only read the queue', () => {
    for (const role of [
      'STUDENT_AFFAIRS_STAFF',
      'VICE_PRINCIPAL_STUDENT_AFFAIRS',
    ]) {
      for (const action of ['read', 'process', 'nis']) {
        expect(codesOf(role)).toContain(`admission-enrollments.${action}`)
      }
    }
    for (const role of ['ADMISSION_ADMIN', 'OPERATOR']) {
      expect(codesOf(role)).toContain('admission-enrollments.read')
      expect(codesOf(role)).not.toContain('admission-enrollments.process')
      expect(codesOf(role)).not.toContain('admission-enrollments.nis')
    }
    for (const role of ['TREASURER']) {
      expect(codesOf(role)).not.toContain('admission-enrollments.process')
      expect(codesOf(role)).not.toContain('admission-enrollments.nis')
    }
    expect(codesOf('PRINCIPAL')).toContain('admission-enrollments.read')
    expect(codesOf('PRINCIPAL')).not.toContain('admission-enrollments.process')
  })

  it('lets TU Kesantrian and the deputy for student affairs read, upload and check late documents, and others only read them', () => {
    for (const role of [
      'STUDENT_AFFAIRS_STAFF',
      'VICE_PRINCIPAL_STUDENT_AFFAIRS',
    ]) {
      for (const action of ['read', 'upload', 'verify']) {
        expect(codesOf(role)).toContain(`admission-late-documents.${action}`)
      }
    }
    for (const role of [
      'ADMISSION_ADMIN',
      'OPERATOR',
      'PRINCIPAL',
      'VICE_PRINCIPAL_CURRICULUM',
    ]) {
      expect(codesOf(role)).toContain('admission-late-documents.read')
      expect(codesOf(role)).not.toContain('admission-late-documents.upload')
      expect(codesOf(role)).not.toContain('admission-late-documents.verify')
    }
    for (const role of ['TREASURER', 'VICE_PRINCIPAL_CURRICULUM']) {
      expect(codesOf(role)).not.toContain('admission-late-documents.upload')
      expect(codesOf(role)).not.toContain('admission-late-documents.verify')
    }
  })

  it('lets applicants apply and nothing else', () => {
    expect(resolveGrants('APPLICANT')).toEqual(['admissions.apply'])
  })

  it('keeps applying for admission out of every staff role', () => {
    const staffWithApply = DEFAULT_ROLES.filter(
      (role) => role.code !== 'APPLICANT',
    )
      .map((role) => role.code)
      .filter((code) => resolveGrants(code).includes('admissions.apply'))
    expect(staffWithApply).toEqual([])
  })

  it('gives the parent role no permissions', () => {
    expect(resolveGrants('PARENT')).toEqual([])
  })

  it('refuses a code missing from the catalog', () => {
    const withoutApply = SYSTEM_PERMISSIONS.filter(
      (p) => p.code !== 'admissions.apply',
    )
    expect(() => resolveGrants('APPLICANT', withoutApply)).toThrow(
      'admissions.apply',
    )
  })

  it('refuses an unknown role', () => {
    expect(() => resolveGrants('NOT_A_ROLE')).toThrow('NOT_A_ROLE')
  })

  it('keeps the structural list to roles the code depends on', () => {
    expect(STRUCTURAL_ROLES.map((r) => r.code).sort()).toEqual([
      'APPLICANT',
      'EMPLOYEE',
      'STUDENT',
      'SUPER_ADMIN',
      'TEACHER',
    ])
  })

  it('lets admission staff read document types and admins manage them', () => {
    expect(codesOf('STUDENT_AFFAIRS_STAFF')).toContain(
      'admission-document-types.read',
    )
    expect(codesOf('STUDENT_AFFAIRS_STAFF')).not.toContain(
      'admission-document-types.delete',
    )
    for (const action of ['read', 'create', 'update', 'delete']) {
      expect(codesOf('OPERATOR')).toContain(
        `admission-document-types.${action}`,
      )
      expect(codesOf('ADMISSION_ADMIN')).toContain(
        `admission-document-types.${action}`,
      )
    }
  })

  it('lets admission staff read downloads and admins manage them', () => {
    expect(codesOf('STUDENT_AFFAIRS_STAFF')).toContain(
      'admission-downloads.read',
    )
    for (const action of ['create', 'update', 'delete']) {
      expect(codesOf('STUDENT_AFFAIRS_STAFF')).not.toContain(
        `admission-downloads.${action}`,
      )
      expect(codesOf('TREASURER')).not.toContain(
        `admission-downloads.${action}`,
      )
    }
    for (const action of ['read', 'create', 'update', 'delete']) {
      expect(codesOf('OPERATOR')).toContain(`admission-downloads.${action}`)
      expect(codesOf('ADMISSION_ADMIN')).toContain(
        `admission-downloads.${action}`,
      )
    }
  })

  it('lets admission staff read the landing settings and admins edit and publish them', () => {
    expect(codesOf('STUDENT_AFFAIRS_STAFF')).toContain('admission-landing.read')
    for (const action of ['update', 'publish']) {
      expect(codesOf('STUDENT_AFFAIRS_STAFF')).not.toContain(
        `admission-landing.${action}`,
      )
      expect(codesOf('TREASURER')).not.toContain(`admission-landing.${action}`)
    }
    for (const action of ['read', 'update', 'publish']) {
      expect(codesOf('OPERATOR')).toContain(`admission-landing.${action}`)
      expect(codesOf('ADMISSION_ADMIN')).toContain(
        `admission-landing.${action}`,
      )
    }
  })

  it('lets only the three leaders decide admissions, and staff read the queue', () => {
    for (const leader of [
      'PRINCIPAL',
      'VICE_PRINCIPAL_CURRICULUM',
      'VICE_PRINCIPAL_STUDENT_AFFAIRS',
    ]) {
      expect(codesOf(leader)).toContain('admission-decisions.read')
      expect(codesOf(leader)).toContain('admission-decisions.decide')
    }
    for (const other of [
      'ADMISSION_ADMIN',
      'OPERATOR',
      'TREASURER',
      'STUDENT_AFFAIRS_STAFF',
      'SYSTEM_ADMIN',
    ]) {
      expect(codesOf(other)).not.toContain('admission-decisions.decide')
    }
    expect(codesOf('ADMISSION_ADMIN')).toContain('admission-decisions.read')
    expect(codesOf('OPERATOR')).toContain('admission-decisions.read')
    expect(codesOf('TREASURER')).not.toContain('admission-decisions.read')
  })

  it('lets the curriculum deputy open an applicant and a file when deciding', () => {
    expect(codesOf('VICE_PRINCIPAL_CURRICULUM')).toContain('admissions.read')
  })

  it('lets admission staff review documents and keeps the treasurer out', () => {
    for (const code of [
      'admission-documents.read',
      'admission-documents.verify',
    ]) {
      expect(codesOf('STUDENT_AFFAIRS_STAFF')).toContain(code)
      expect(codesOf('ADMISSION_ADMIN')).toContain(code)
      expect(codesOf('OPERATOR')).toContain(code)
      expect(codesOf('TREASURER')).not.toContain(code)
    }
  })

  it('lets the treasurer work payments but not documents, and staff only read them', () => {
    for (const action of ['read', 'verify', 'create']) {
      expect(codesOf('TREASURER')).toContain(`admission-payments.${action}`)
      expect(codesOf('ADMISSION_ADMIN')).toContain(
        `admission-payments.${action}`,
      )
      expect(codesOf('OPERATOR')).toContain(`admission-payments.${action}`)
    }
    expect(codesOf('TREASURER')).not.toContain('admissions.verify')
    expect(codesOf('STUDENT_AFFAIRS_STAFF')).toContain(
      'admission-payments.read',
    )
    expect(codesOf('STUDENT_AFFAIRS_STAFF')).not.toContain(
      'admission-payments.verify',
    )
  })

  it('lets the treasurer read waves for the payment queue filter', () => {
    expect(codesOf('TREASURER')).toContain('admission-waves.read')
  })

  describe('exam questions', () => {
    const teacherCodes = ['read', 'create', 'update', 'delete'].map(
      (action) => `exam-questions.${action}`,
    )

    it('lets a teacher read, write and delete questions but never approve or manage others', () => {
      for (const code of teacherCodes)
        expect(codesOf('TEACHER')).toContain(code)
      expect(codesOf('TEACHER')).not.toContain('exam-questions.approve')
      expect(codesOf('TEACHER')).not.toContain('exam-questions.manage-all')
    })

    it('lets the deputy for curriculum hold all six codes', () => {
      for (const action of [
        'read',
        'create',
        'update',
        'delete',
        'approve',
        'manage-all',
      ]) {
        expect(codesOf('VICE_PRINCIPAL_CURRICULUM')).toContain(
          `exam-questions.${action}`,
        )
      }
    })

    it('lets curriculum staff help with every question but not approve', () => {
      for (const code of [...teacherCodes, 'exam-questions.manage-all']) {
        expect(codesOf('CURRICULUM_STAFF')).toContain(code)
      }
      expect(codesOf('CURRICULUM_STAFF')).not.toContain(
        'exam-questions.approve',
      )
    })

    it('keeps every exam question code away from students and applicants', () => {
      for (const role of ['STUDENT', 'APPLICANT', 'EMPLOYEE']) {
        expect(
          [...codesOf(role)].filter((code) =>
            code.startsWith('exam-questions.'),
          ),
        ).toEqual([])
      }
    })

    it('never gives approve or manage-all through a broad grant', () => {
      const holders = DEFAULT_ROLES.filter(
        (role) =>
          codesOf(role.code).has('exam-questions.approve') ||
          codesOf(role.code).has('exam-questions.manage-all'),
      ).map((role) => role.code)

      expect(holders.sort()).toEqual([
        'CURRICULUM_STAFF',
        'VICE_PRINCIPAL_CURRICULUM',
      ])
    })
  })

  describe('exam packages and schedules', () => {
    const codes = [
      ...['read', 'create', 'update', 'delete'].map(
        (action) => `exam-packages.${action}`,
      ),
      ...['read', 'create', 'update', 'cancel', 'access-code'].map(
        (action) => `exam-schedules.${action}`,
      ),
    ]

    it('gives every code to curriculum staff, the deputy for curriculum and the academic admin', () => {
      for (const role of [
        'CURRICULUM_STAFF',
        'VICE_PRINCIPAL_CURRICULUM',
        'ACADEMIC_ADMIN',
      ]) {
        for (const code of codes) expect(codesOf(role)).toContain(code)
      }
    })

    it('keeps the codes away from teachers, students, applicants, employees and the operator', () => {
      for (const role of [
        'TEACHER',
        'STUDENT',
        'APPLICANT',
        'EMPLOYEE',
        'OPERATOR',
      ]) {
        expect(
          [...codesOf(role)].filter(
            (code) =>
              code.startsWith('exam-packages.') ||
              code.startsWith('exam-schedules.'),
          ),
        ).toEqual([])
      }
    })

    it('never gives the changing codes through a broad grant', () => {
      const changing = codes.filter((code) => !code.endsWith('.read'))
      const holders = DEFAULT_ROLES.filter((role) =>
        changing.some((code) => codesOf(role.code).has(code)),
      ).map((role) => role.code)

      expect(holders.sort()).toEqual([
        'ACADEMIC_ADMIN',
        'CURRICULUM_STAFF',
        'VICE_PRINCIPAL_CURRICULUM',
      ])
    })

    it('lets the principal read packages and schedules but not see the access code', () => {
      expect(codesOf('PRINCIPAL')).toContain('exam-packages.read')
      expect(codesOf('PRINCIPAL')).toContain('exam-schedules.read')
      expect(codesOf('PRINCIPAL')).not.toContain('exam-schedules.access-code')
    })
  })
})
