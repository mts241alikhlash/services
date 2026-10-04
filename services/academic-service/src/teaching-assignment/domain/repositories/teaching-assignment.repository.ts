import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import {
  TeachingAssignmentWithDetails,
  TeachingAssignmentEntity,
} from '../entities/teaching-assignment.entity.js'

export type { TeachingAssignmentWithDetails }

export interface ClassroomReference {
  id: string
  academicYearId: string
}

export interface SemesterReference {
  id: string
  academicYearId: string
}

export interface TeachingAssignmentRepositoryQueryInput extends PaginationQueryInput {
  employeeId?: string
  classroomId?: string
  subjectId?: string
  semesterId?: string
}

export interface CreateTeachingAssignmentRepositoryInput {
  employeeId: string
  classroomId: string
  subjectId: string
  semesterId: string
}

export type UpdateTeachingAssignmentRepositoryInput =
  Partial<CreateTeachingAssignmentRepositoryInput> & {
    passingScore?: number | null
  }

export type RestoreTeachingAssignmentRepositoryInput =
  Partial<CreateTeachingAssignmentRepositoryInput>

export interface TeachingAssignmentDetailRow {
  id: string
  employeeId: string
  classroomId: string
  subjectId: string
  semesterId: string
  subjectCode: string | null
  subjectName: string
  classroomCode: string
  classroomName: string | null
  classroomGradeId: string
  classroomAcademicYearId: string
  passingScore: number | null

  employeeUserId: string | null
}

export interface TeachingLoadSummary {
  classroomCount: number
  subjectCount: number
}

export abstract class ITeachingAssignmentRepository {
  abstract findAll(
    query: TeachingAssignmentRepositoryQueryInput,
  ): Promise<PaginatedResult<TeachingAssignmentWithDetails>>
  abstract findById(id: string): Promise<TeachingAssignmentWithDetails | null>
  abstract findDetailsByIds(
    ids: string[],
  ): Promise<TeachingAssignmentDetailRow[]>
  abstract findDetailsByEmployee(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingAssignmentDetailRow[]>
  abstract listEmployeeIdsForAcademicYear(
    academicYearId: string,
  ): Promise<string[]>
  abstract existsForEmployee(id: string, employeeId: string): Promise<boolean>
  abstract summariseLoad(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingLoadSummary>
  abstract findDuplicate(
    employeeId: string,
    classroomId: string,
    subjectId: string,
    semesterId: string,
    excludeId?: string,
  ): Promise<TeachingAssignmentEntity | null>
  abstract create(
    input: CreateTeachingAssignmentRepositoryInput,
  ): Promise<TeachingAssignmentWithDetails>
  abstract update(
    id: string,
    input: UpdateTeachingAssignmentRepositoryInput,
  ): Promise<TeachingAssignmentWithDetails>
  abstract findSoftDeleted(
    employeeId: string,
    classroomId: string,
    subjectId: string,
    semesterId: string,
  ): Promise<TeachingAssignmentEntity | null>
  abstract restore(
    id: string,
    input: RestoreTeachingAssignmentRepositoryInput,
  ): Promise<TeachingAssignmentWithDetails>
  abstract softDelete(id: string): Promise<TeachingAssignmentEntity>
  abstract remove(id: string): Promise<TeachingAssignmentEntity>
  abstract findClassroomById(id: string): Promise<ClassroomReference | null>
  abstract findSemesterById(id: string): Promise<SemesterReference | null>
}
