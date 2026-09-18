import { CodedRef } from '../../../../shared/domain/entities/index.js'

export interface PositionEntity {
  id: string
  name: string
  categoryId: string
  isActive: boolean
  deletedAt?: Date | null
}

export interface PositionWithCategory extends PositionEntity {
  category?: CodedRef
}
