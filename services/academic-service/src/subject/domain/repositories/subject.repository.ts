import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import {
  SubjectEntity,
  SubjectWithEmployees,
} from '../entities/subject.entity.js'

export type { SubjectWithEmployees }

export interface SubjectQueryInput extends PaginationQueryInput {
  search?: string
}

export interface CreateSubjectRepositoryInput {
  code?: string
  name: string
}

export interface UpdateSubjectRepositoryInput {
  code?: string
  name?: string
}

export abstract class ISubjectRepository {
  abstract findAll(
    query: SubjectQueryInput,
  ): Promise<PaginatedResult<SubjectWithEmployees>>

  abstract findById(id: string): Promise<SubjectWithEmployees | null>

  abstract findByCode(
    code: string,
    excludeId?: string,
  ): Promise<SubjectEntity | null>

  abstract findByName(
    name: string,
    excludeId?: string,
  ): Promise<SubjectEntity | null>

  abstract create(input: CreateSubjectRepositoryInput): Promise<SubjectEntity>

  abstract update(
    id: string,
    input: UpdateSubjectRepositoryInput,
  ): Promise<SubjectEntity>

  abstract remove(id: string): Promise<SubjectEntity>

  abstract countActiveAssignments(id: string): Promise<number>
}
