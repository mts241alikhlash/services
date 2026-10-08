import { SYSTEM_PERMISSIONS } from '../../permission/constants/permission-codes.constants.js'
import { DEFAULT_ROLES, resolveGrants } from './default-roles.js'
import { STRUCTURAL_ROLES } from './policies/structural-roles.policy.js'

const codesOf = (role: string) => new Set(resolveGrants(role))
const contains = (outer: string, inner: string) =>
  [...codesOf(inner)].every((code) => codesOf(outer).has(code))

describe('default roles', () => {
  it('resolves every role against the catalogue', () => {
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

  it('refuses a code missing from the catalogue', () => {
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
})
