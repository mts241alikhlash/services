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

  it('defines the twenty-one default roles and three structural grants', () => {
    expect(DEFAULT_ROLES.filter((role) => !role.structural)).toHaveLength(21)
    expect(
      DEFAULT_ROLES.filter((role) => role.structural)
        .map((role) => role.code)
        .sort(),
    ).toEqual(['APPLICANT', 'STUDENT', 'TEACHER'])
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
})
