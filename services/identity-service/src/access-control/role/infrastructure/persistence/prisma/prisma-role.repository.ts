import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { Prisma } from '../../../../../generated/prisma/client.js'
import { PrismaService } from '../../../../../core/database/prisma.service.js'
import {
  CreateRoleRepositoryInput,
  CreateStructuralRoleRepositoryInput,
  IRoleRepository,
  RoleWithPermissions,
  UpdateRoleRepositoryInput,
} from '../../../domain/repositories/role.repository.js'
import { isStructuralRole } from '../../../domain/policies/structural-roles.policy.js'

const ROLE_INCLUDE = {
  rolePermissions: { include: { permission: true } },
} satisfies Prisma.RoleInclude

type RoleRow = Prisma.RoleGetPayload<{ include: typeof ROLE_INCLUDE }>

function toRoleWithPermissions(role: RoleRow): RoleWithPermissions {
  const { rolePermissions, ...rest } = role
  return { ...rest, permissions: rolePermissions.map((rp) => rp.permission) }
}

@Injectable()
export class PrismaRoleRepository extends IRoleRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(isSuperAdmin = false): Promise<RoleWithPermissions[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        ...(!isSuperAdmin && { code: { not: 'SUPER_ADMIN' } }),
      },
      include: ROLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    })
    return roles.map(toRoleWithPermissions)
  }

  async findById(
    id: string,
    isSuperAdmin = true,
  ): Promise<RoleWithPermissions | null> {
    const role = await this.prisma.role.findFirst({
      where: {
        id,
        ...(!isSuperAdmin && { code: { not: 'SUPER_ADMIN' } }),
      },
      include: ROLE_INCLUDE,
    })
    return role ? toRoleWithPermissions(role) : null
  }

  async findByCode(code: string) {
    return this.prisma.role.findFirst({ where: { code } })
  }

  async create(data: CreateRoleRepositoryInput): Promise<RoleWithPermissions> {
    const { permissionIds, ...roleData } = data
    const role = await this.prisma.role.create({
      data: {
        ...roleData,
        isSystem: isStructuralRole(data.code),
        ...(permissionIds?.length
          ? {
              rolePermissions: {
                create: permissionIds.map((permissionId) => ({
                  permissionId,
                })),
              },
            }
          : {}),
      },
      include: ROLE_INCLUDE,
    })
    return toRoleWithPermissions(role)
  }

  async update(
    id: string,
    data: UpdateRoleRepositoryInput,
  ): Promise<RoleWithPermissions> {
    const { permissionIds, ...roleData } = data
    const role = await this.prisma.$transaction(async (tx) => {
      await tx.role.update({ where: { id }, data: roleData })

      if (permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } })
        if (permissionIds.length) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
            skipDuplicates: true,
          })
        }
      }

      return tx.role.findFirstOrThrow({ where: { id }, include: ROLE_INCLUDE })
    })
    return toRoleWithPermissions(role)
  }

  async delete(id: string) {
    return this.prisma.role.delete({ where: { id } })
  }

  async createStructural(input: CreateStructuralRoleRepositoryInput) {
    return this.prisma.role.create({ data: { ...input, isSystem: true } })
  }

  async markSystem(id: string) {
    return this.prisma.role.update({
      where: { id },
      data: { isSystem: true },
    })
  }

  async ensureStructuralPermissions(
    roleCode: string,
    permissionCodes: string[],
  ): Promise<number> {
    const [role, permissions] = await Promise.all([
      this.prisma.role.findUnique({ where: { code: roleCode } }),
      this.prisma.permission.findMany({
        where: { code: { in: permissionCodes } },
        select: { id: true, code: true },
      }),
    ])
    if (!role) {
      throw new InternalServerErrorException(
        `Structural role ${roleCode} was not created`,
      )
    }
    if (permissions.length !== new Set(permissionCodes).size) {
      const found = new Set(permissions.map((permission) => permission.code))
      const missing = permissionCodes.filter((code) => !found.has(code))
      throw new InternalServerErrorException(
        `Structural role ${roleCode} permissions are missing: ${missing.join(', ')}`,
      )
    }
    const held = await this.prisma.rolePermission.count({
      where: {
        roleId: role.id,
        permissionId: { in: permissions.map((permission) => permission.id) },
      },
    })
    if (held > 0) return 0
    const assigned = await this.prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    })
    return assigned.count
  }

  async assignRoleToUser(userId: string, roleId: string) {
    return this.prisma.userRole.create({ data: { userId, roleId } })
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    return this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    })
  }

  async findUserRole(userId: string, roleId: string) {
    return this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    })
  }

  async findUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })
  }
}
