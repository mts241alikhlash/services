import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import { AcademicYear } from '../entities/academic-year.entity.js'

export interface AcademicYearQueryInput extends PaginationQueryInput {
  search?: string
}

export interface CreateAcademicYearRepositoryInput {
  name: string
  startYear: number
  isActive?: boolean
}

export type UpdateAcademicYearRepositoryInput =
  Partial<CreateAcademicYearRepositoryInput>

export interface AffectedCount {
  count: number
}

export abstract class IAcademicYearRepository {
  abstract findAll(
    query: AcademicYearQueryInput,
  ): Promise<PaginatedResult<AcademicYear>>
  abstract findById(id: string): Promise<AcademicYear | null>
  abstract findManyByIds(ids: string[]): Promise<AcademicYear[]>
  abstract findActive(): Promise<AcademicYear | null>
  abstract findByName(name: string): Promise<AcademicYear | null>
  abstract create(
    input: CreateAcademicYearRepositoryInput,
  ): Promise<AcademicYear>
  abstract update(
    id: string,
    input: UpdateAcademicYearRepositoryInput,
  ): Promise<AcademicYear>
  abstract softDelete(id: string): Promise<AcademicYear>
  abstract deactivateAll(excludeId?: string): Promise<AffectedCount>
  abstract activateById(id: string): Promise<AcademicYear>
  abstract countActive(): Promise<number>
  abstract deactivateSemestersByAcademicYearId(
    id: string,
  ): Promise<AffectedCount>
  abstract hasRelatedData(id: string): Promise<boolean>
}
