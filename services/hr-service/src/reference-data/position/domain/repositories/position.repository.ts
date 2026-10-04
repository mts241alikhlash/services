import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  PositionEntity,
  PositionWithCategory,
} from '../entities/position.entity.js'

export type { PositionWithCategory }

export interface PositionQueryInput extends PaginationQueryInput {
  search?: string
  categoryId?: string
  isActive?: boolean
}

export interface CreatePositionRepositoryInput {
  name: string
  categoryId: string
  isActive?: boolean
}

export interface UpdatePositionRepositoryInput {
  name?: string
  categoryId?: string
  isActive?: boolean
}

export abstract class IPositionRepository {
  abstract findAll(
    query: PositionQueryInput,
  ): Promise<PaginatedResult<PositionWithCategory>>

  abstract findById(id: string): Promise<PositionWithCategory | null>

  abstract findByName(
    name: string,
    excludeId?: string,
  ): Promise<PositionEntity | null>

  abstract findByCode(
    code: string,
    excludeId?: string,
  ): Promise<PositionEntity | null>

  abstract create(
    dto: CreatePositionRepositoryInput,
  ): Promise<PositionWithCategory>

  abstract update(
    id: string,
    dto: UpdatePositionRepositoryInput,
  ): Promise<PositionWithCategory>

  abstract remove(id: string): Promise<PositionEntity>

  abstract countEmployeesWithPosition(id: string): Promise<number>

  abstract countActiveAssignments(id: string): Promise<number>
}
