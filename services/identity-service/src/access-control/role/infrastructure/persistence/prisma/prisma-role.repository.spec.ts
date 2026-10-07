import { PrismaRoleRepository } from './prisma-role.repository.js'

describe('PrismaRoleRepository.ensureStructuralPermissions', () => {
  function repositoryWith(
    role: { id: string } | null = { id: 'role-employee' },
    permissions = [
      { id: 'permission-1', code: 'employees.read-own' },
      { id: 'permission-2', code: 'leave-requests.read-own' },
    ],
    held = 0,
  ) {
    const prisma = {
      role: { findUnique: jest.fn().mockResolvedValue(role) },
      permission: { findMany: jest.fn().mockResolvedValue(permissions) },
      rolePermission: {
        count: jest.fn().mockResolvedValue(held),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    }
    return {
      repository: new PrismaRoleRepository(prisma as never),
      prisma,
    }
  }

  it('grants the whole bundle while the role holds none of it', async () => {
    const { repository, prisma } = repositoryWith()

    await expect(
      repository.ensureStructuralPermissions('EMPLOYEE', [
        'employees.read-own',
        'leave-requests.read-own',
      ]),
    ).resolves.toBe(1)
    expect(prisma.rolePermission.createMany).toHaveBeenCalledWith({
      data: [
        { roleId: 'role-employee', permissionId: 'permission-1' },
        { roleId: 'role-employee', permissionId: 'permission-2' },
      ],
      skipDuplicates: true,
    })
  })

  it('keeps what the school removed: grants nothing while the role still holds part of the bundle', async () => {
    const { repository, prisma } = repositoryWith(undefined, undefined, 1)

    await expect(
      repository.ensureStructuralPermissions('EMPLOYEE', [
        'employees.read-own',
        'leave-requests.read-own',
      ]),
    ).resolves.toBe(0)
    expect(prisma.rolePermission.count).toHaveBeenCalledWith({
      where: {
        roleId: 'role-employee',
        permissionId: { in: ['permission-1', 'permission-2'] },
      },
    })
    expect(prisma.rolePermission.createMany).not.toHaveBeenCalled()
  })

  it('fails bootstrap when a required permission is absent', async () => {
    const { repository, prisma } = repositoryWith(undefined, [
      { id: 'permission-1', code: 'employees.read-own' },
    ])

    await expect(
      repository.ensureStructuralPermissions('EMPLOYEE', [
        'employees.read-own',
        'leave-requests.read-own',
      ]),
    ).rejects.toThrow('leave-requests.read-own')
    expect(prisma.rolePermission.createMany).not.toHaveBeenCalled()
  })

  it('fails bootstrap when structural role is absent', async () => {
    const { repository, prisma } = repositoryWith(null)

    await expect(
      repository.ensureStructuralPermissions('EMPLOYEE', [
        'employees.read-own',
        'leave-requests.read-own',
      ]),
    ).rejects.toThrow('Structural role EMPLOYEE was not created')
    expect(prisma.rolePermission.createMany).not.toHaveBeenCalled()
  })
})
