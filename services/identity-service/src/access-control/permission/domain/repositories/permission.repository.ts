import {
  PermissionEntity,
  RolePermissionEntity,
} from '../../../domain/entities/permission.entity.js'
import { UserRoleWithRoleEntity as UserRoleWithRole } from '../../../domain/entities/role.entity.js'

export interface CreatePermissionRepositoryInput {
  module: string
  action: string
  code: string
  description: string
}

export type UpsertPermissionRepositoryInput = CreatePermissionRepositoryInput

export interface UpdatePermissionRepositoryInput {
  description: string
}

export abstract class IPermissionRepository {
  abstract findAll(): Promise<PermissionEntity[]>
  abstract findById(id: string): Promise<PermissionEntity | null>
  abstract findByCode(code: string): Promise<PermissionEntity | null>
  abstract findUserRoles(userId: string): Promise<UserRoleWithRole[]>
  abstract findUserPermissions(userId: string): Promise<string[]>
  abstract findRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermissionEntity | null>
  abstract assignPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermissionEntity>
  abstract removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermissionEntity>
  abstract upsertPermission(
    data: UpsertPermissionRepositoryInput,
  ): Promise<PermissionEntity>
  abstract createPermission(
    data: CreatePermissionRepositoryInput,
  ): Promise<PermissionEntity>
  abstract updatePermission(
    id: string,
    data: UpdatePermissionRepositoryInput,
  ): Promise<PermissionEntity>
  abstract deletePermission(id: string): Promise<PermissionEntity>
}
