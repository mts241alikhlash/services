import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import { Semester, SemesterWithDetails } from '../entities/semester.entity.js'

export interface SemesterTypeRow {
  id: string
  name: string
  isActive?: boolean
}

export interface SemesterQueryInput extends PaginationQueryInput {
  search?: string
  academicYearId?: string
  isActive?: boolean
}

export interface CreateSemesterRepositoryInput {
  academicYearId: string
  typeId: string
  startDate?: Date
  endDate?: Date
  isActive?: boolean
}

export interface UpdateSemesterRepositoryInput {
  academicYearId?: string
  typeId?: string
  startDate?: Date | null
  endDate?: Date | null
  isActive?: boolean
}

export abstract class ISemesterRepository {
  abstract findAll(
    query: SemesterQueryInput,
  ): Promise<PaginatedResult<SemesterWithDetails>>
  abstract findById(id: string): Promise<SemesterWithDetails | null>
  abstract findManyByIds(ids: string[]): Promise<SemesterWithDetails[]>
  abstract findActive(): Promise<SemesterWithDetails | null>
  abstract findTypeById(id: string): Promise<SemesterTypeRow | null>
  abstract findByAcademicYearAndType(
    academicYearId: string,
    typeId: string,
  ): Promise<Semester | null>
  abstract create(
    input: CreateSemesterRepositoryInput,
  ): Promise<SemesterWithDetails>
  abstract update(
    id: string,
    input: UpdateSemesterRepositoryInput,
  ): Promise<SemesterWithDetails>
  abstract deactivateAll(): Promise<{ count: number }>
  abstract activateById(id: string): Promise<SemesterWithDetails>
  abstract findFirstDependent(id: string): Promise<string | null>
  abstract softDelete(id: string): Promise<Semester>
}
