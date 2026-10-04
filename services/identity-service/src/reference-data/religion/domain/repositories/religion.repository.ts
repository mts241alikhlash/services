import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import { ReligionEntity } from '../entities/religion.entity.js'

export type { ReligionEntity }

export interface ReligionQueryInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}

export interface CreateReligionRepositoryInput {
  name: string
  isActive?: boolean
}

export type UpdateReligionRepositoryInput =
  Partial<CreateReligionRepositoryInput>

export abstract class IReligionRepository {
  abstract findAll(
    query: ReligionQueryInput,
  ): Promise<PaginatedResult<ReligionEntity>>
  abstract findById(id: string): Promise<ReligionEntity | null>
  abstract findManyByIds(ids: string[]): Promise<ReligionEntity[]>
  abstract findByName(name: string): Promise<ReligionEntity | null>
  abstract create(input: CreateReligionRepositoryInput): Promise<ReligionEntity>
  abstract update(
    id: string,
    input: UpdateReligionRepositoryInput,
  ): Promise<ReligionEntity>
  abstract softDelete(id: string): Promise<ReligionEntity>
  abstract countProfilesUsing(id: string): Promise<number>
}
