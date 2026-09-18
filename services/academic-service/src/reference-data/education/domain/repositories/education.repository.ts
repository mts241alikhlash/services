import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import { EducationEntity } from '../entities/education.entity.js'

export type { EducationEntity }

export interface EducationQueryInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}

export abstract class IEducationRepository {
  abstract findAll(
    query: EducationQueryInput,
  ): Promise<PaginatedResult<EducationEntity>>
  abstract findById(id: string): Promise<EducationEntity | null>
  abstract findManyByIds(ids: string[]): Promise<EducationEntity[]>
}
