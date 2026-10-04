export interface CreateRoleInput {
  name: string
  code: string
  description?: string
  permissionIds?: string[]
}
