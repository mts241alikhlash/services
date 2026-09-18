import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../../shared/domain/interfaces/repository.interface.js'
import { BloodTypeEntity } from '../entities/blood-type.entity.js'

export type { BloodTypeEntity }

export interface BloodTypeQueryInput extends PaginationQueryInput {
  search?: string
  isActive?: boolean
}

export interface CreateBloodTypeRepositoryInput {
  name: string
  isActive?: boolean
}

export type UpdateBloodTypeRepositoryInput =
  Partial<CreateBloodTypeRepositoryInput>

export abstract class IBloodTypeRepository {
  abstract findAll(
    query: BloodTypeQueryInput,
  ): Promise<PaginatedResult<BloodTypeEntity>>
  abstract findById(id: string): Promise<BloodTypeEntity | null>
  abstract findManyByIds(ids: string[]): Promise<BloodTypeEntity[]>
  abstract findByName(name: string): Promise<BloodTypeEntity | null>
  abstract create(
    input: CreateBloodTypeRepositoryInput,
  ): Promise<BloodTypeEntity>
  abstract update(
    id: string,
    input: UpdateBloodTypeRepositoryInput,
  ): Promise<BloodTypeEntity>
  abstract softDelete(id: string): Promise<BloodTypeEntity>
  abstract countProfilesUsing(id: string): Promise<number>
}
