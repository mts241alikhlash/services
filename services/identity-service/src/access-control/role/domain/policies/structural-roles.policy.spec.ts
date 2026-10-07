import {
  EMPLOYEE_SELF_SERVICE_PERMISSIONS,
  STRUCTURAL_ROLES,
} from './structural-roles.policy.js'

describe('structural role permissions', () => {
  it('lists the employee self-service bundle on EMPLOYEE and TEACHER and on no other role', () => {
    const withPermissions = STRUCTURAL_ROLES.filter((role) => role.permissions)

    expect(withPermissions.map((role) => role.code).sort()).toEqual([
      'EMPLOYEE',
      'TEACHER',
    ])
    for (const role of withPermissions) {
      expect(role.permissions).toEqual([...EMPLOYEE_SELF_SERVICE_PERMISSIONS])
    }
  })
})
