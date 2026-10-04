export interface UserPublic {
  id: string
  identifier: string
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}
