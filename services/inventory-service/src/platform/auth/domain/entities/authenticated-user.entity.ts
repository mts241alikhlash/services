export interface SessionUserRef {
  id: string
  identifier: string
  isActive: boolean
  deletedAt?: Date | null
}

export interface UserWithProfileAndRoles {
  id: string
  identifier: string
  passwordHash: string
  isActive: boolean
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  profile?: { name: string } | null
  userRoles?: {
    roleId: string
    role: {
      id: string
      code: string
      name: string
      rolePermissions?: { permission: { code: string } }[]
    }
  }[]
}
