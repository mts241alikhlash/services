export interface UserEntity {
  id: string
  identifier: string
  passwordHash?: string | null
  isActive: boolean
  lastLoginAt?: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}
