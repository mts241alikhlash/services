export interface DeviceEntity {
  id: string
  name: string
  location?: string | null
  isActive: boolean
  lastSeenAt?: Date | null
  tokenIssuedAt: Date
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface DeviceAuthContext {
  id: string
  name: string
  isActive: boolean
}
