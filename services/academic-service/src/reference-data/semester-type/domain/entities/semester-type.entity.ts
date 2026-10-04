export interface SemesterTypeEntity {
  id: string
  name: string
  sequence: number
  isActive: boolean
  deletedAt?: Date | null
}
