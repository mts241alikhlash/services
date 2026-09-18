export interface OccupationEntity {
  id: string
  name: string
  isActive: boolean
  deletedAt?: Date | null
}

export type OccupationWithCount = OccupationEntity
