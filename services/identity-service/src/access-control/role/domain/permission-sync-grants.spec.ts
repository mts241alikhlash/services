import { syncPermissions } from '../../../../prisma/seeds/modules/permission-sync.seed.js'
import { DEFAULT_ROLES } from './default-roles.js'
import { SYSTEM_PERMISSIONS } from '../../permission/constants/permission-codes.constants.js'

const NEW_CODES = SYSTEM_PERMISSIONS.map((p) => p.code).filter(
  (code) =>
    code.startsWith('admission-document-types.') ||
    code.startsWith('admission-documents.') ||
    code.startsWith('admission-decisions.') ||
    code.startsWith('admission-enrolments.'),
)

function fakePrisma(existingCodes: string[], roleCodes: string[]) {
  const permissions = new Map(existingCodes.map((c, i) => [c, `p${i}`]))
  const roles = new Map(roleCodes.map((c, i) => [c, `r${i}`]))
  const grants: { roleId: string; permissionId: string }[] = []
  const roleCode = (id: string) => [...roles].find(([, rid]) => rid === id)![0]
  const permissionCode = (id: string) =>
    [...permissions].find(([, pid]) => pid === id)![0]

  const prisma = {
    permission: {
      findMany: jest.fn(() =>
        Promise.resolve([...permissions].map(([code, id]) => ({ code, id }))),
      ),
      upsert: jest.fn(({ where }: { where: { code: string } }) => {
        if (!permissions.has(where.code)) {
          permissions.set(where.code, `p${permissions.size}`)
        }
        return Promise.resolve({ id: permissions.get(where.code) })
      }),
    },
    role: {
      upsert: jest.fn(({ where }: { where: { code: string } }) => {
        if (!roles.has(where.code)) roles.set(where.code, `r${roles.size}`)
        return Promise.resolve({ id: roles.get(where.code) })
      }),
      findUnique: jest.fn(({ where }: { where: { code: string } }) =>
        Promise.resolve(
          roles.has(where.code)
            ? { id: roles.get(where.code), _count: { rolePermissions: 1 } }
            : null,
        ),
      ),
      findMany: jest.fn(({ where }: { where: { code: { in: string[] } } }) =>
        Promise.resolve(
          where.code.in
            .filter((code) => roles.has(code))
            .map((code) => ({ id: roles.get(code), code })),
        ),
      ),
      create: jest.fn(),
    },
    rolePermission: {
      createMany: jest.fn(
        ({ data }: { data: { roleId: string; permissionId: string }[] }) => {
          grants.push(...data)
          return Promise.resolve({ count: data.length })
        },
      ),
    },
  }
  const grantedTo = (code: string) =>
    [
      ...new Set(
        grants
          .filter((g) => permissionCode(g.permissionId) === code)
          .map((g) => roleCode(g.roleId)),
      ),
    ].sort()
  return { prisma, grantedTo }
}

describe('syncPermissions grants brand-new codes to existing default roles', () => {
  const catalogue = SYSTEM_PERMISSIONS.map((p) => p.code)
  const allRoles = DEFAULT_ROLES.map((r) => r.code)
  const before = catalogue.filter((code) => !NEW_CODES.includes(code))

  it('gives a new code to the default roles that define it', async () => {
    const { prisma, grantedTo } = fakePrisma(before, allRoles)
    await syncPermissions(prisma as never)

    const read = grantedTo('admission-document-types.read')
    expect(read).toEqual(
      expect.arrayContaining([
        'ADMISSION_ADMIN',
        'OPERATOR',
        'STUDENT_AFFAIRS_STAFF',
        'SUPER_ADMIN',
      ]),
    )
    expect(read).not.toContain('TREASURER')
    expect(grantedTo('admission-document-types.delete')).not.toContain(
      'STUDENT_AFFAIRS_STAFF',
    )
    const verify = grantedTo('admission-documents.verify')
    expect(verify).toEqual(
      expect.arrayContaining([
        'ADMISSION_ADMIN',
        'OPERATOR',
        'STUDENT_AFFAIRS_STAFF',
        'SUPER_ADMIN',
      ]),
    )
    expect(verify).not.toContain('TREASURER')
    const decide = grantedTo('admission-decisions.decide')
    expect(decide).toEqual(
      expect.arrayContaining([
        'PRINCIPAL',
        'VICE_PRINCIPAL_CURRICULUM',
        'VICE_PRINCIPAL_STUDENT_AFFAIRS',
        'SUPER_ADMIN',
      ]),
    )
    expect(decide).not.toContain('ADMISSION_ADMIN')
    expect(decide).not.toContain('OPERATOR')
    expect(grantedTo('admission-decisions.read')).toEqual(
      expect.arrayContaining(['ADMISSION_ADMIN', 'OPERATOR', 'PRINCIPAL']),
    )
    const process = grantedTo('admission-enrolments.process')
    expect(process).toEqual(
      expect.arrayContaining([
        'STUDENT_AFFAIRS_STAFF',
        'VICE_PRINCIPAL_STUDENT_AFFAIRS',
        'SUPER_ADMIN',
      ]),
    )
    expect(process).not.toContain('ADMISSION_ADMIN')
    expect(process).not.toContain('OPERATOR')
    expect(grantedTo('admission-enrolments.read')).toEqual(
      expect.arrayContaining([
        'ADMISSION_ADMIN',
        'OPERATOR',
        'STUDENT_AFFAIRS_STAFF',
      ]),
    )
  })

  it('leaves existing roles alone once the code is already in the database', async () => {
    const { prisma, grantedTo } = fakePrisma(catalogue, allRoles)
    await syncPermissions(prisma as never)

    expect(
      grantedTo('admission-document-types.read').filter(
        (code) => code !== 'SUPER_ADMIN',
      ),
    ).toEqual([])
  })
})
