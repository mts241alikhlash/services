import { PrismaClient } from '../../../src/generated/prisma/client.js'
import {
  DEFAULT_ROLES,
  resolveGrants,
} from '../../../src/access-control/role/domain/default-roles.js'
import { SYSTEM_PERMISSIONS } from '../../../src/access-control/permission/constants/permission-codes.constants.js'

export async function syncPermissions(prisma: PrismaClient) {
  const permissionIds: string[] = []
  for (const perm of SYSTEM_PERMISSIONS) {
    const dbPerm = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        module: perm.module,
        action: perm.action,
        description: perm.description,
      },
      create: perm,
    })
    permissionIds.push(dbPerm.id)
  }

  const superAdmin = await prisma.role.upsert({
    where: { code: 'SUPER_ADMIN' },
    update: {},
    create: {
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'Platform Super Admin',
      isSystem: true,
    },
  })

  const granted = await prisma.rolePermission.createMany({
    data: permissionIds.map((permissionId) => ({
      roleId: superAdmin.id,
      permissionId,
    })),
    skipDuplicates: true,
  })

  console.log(
    `  [permissions] ${permissionIds.length} in catalog, ${granted.count} newly granted to SUPER_ADMIN.`,
  )

  const idByCode = new Map(
    (
      await prisma.permission.findMany({ select: { id: true, code: true } })
    ).map((p) => [p.code, p.id]),
  )

  const created: string[] = []
  const seeded: string[] = []
  for (const role of DEFAULT_ROLES) {
    const existing = await prisma.role.findUnique({
      where: { code: role.code },
      include: { _count: { select: { rolePermissions: true } } },
    })
    if (existing && (!role.structural || existing._count.rolePermissions > 0)) {
      continue
    }
    const target =
      existing ??
      (await prisma.role.create({
        data: {
          code: role.code,
          name: role.name,
          description: role.description,
          isSystem: role.structural,
        },
      }))
    await prisma.rolePermission.createMany({
      data: resolveGrants(role.code)
        .map((code) => idByCode.get(code))
        .filter((id): id is string => id !== undefined)
        .map((permissionId) => ({ roleId: target.id, permissionId })),
      skipDuplicates: true,
    })
    ;(existing ? seeded : created).push(role.code)
  }
  console.log(
    `  [roles] created ${created.length} (${created.join(', ') || 'none'}), granted ${seeded.length} empty structural roles (${seeded.join(', ') || 'none'}).`,
  )
}
