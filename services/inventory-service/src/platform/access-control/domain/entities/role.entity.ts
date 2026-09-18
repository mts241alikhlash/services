import type { PermissionEntity } from './permission.entity.js'

export interface RoleEntity {
  id: string
  name: string
  code: string
  description?: string | null
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserRoleEntity {
  userId: string
  roleId: string
}

export type UserRoleWithRoleEntity = UserRoleEntity & {
  role: RoleEntity
}

export type RoleWithPermissionsEntity = RoleEntity & {
  permissions: PermissionEntity[]
}
