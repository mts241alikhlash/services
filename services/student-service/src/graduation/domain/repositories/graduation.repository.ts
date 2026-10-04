import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import {
  StudentGraduationEntity,
  GraduationWithDetails,
  GraduationWithDetails as StudentGraduationWithDetails,
} from '../entities/graduation.entity.js'

export type { GraduationWithDetails, StudentGraduationWithDetails }

export interface StudentGraduationQueryInput extends PaginationQueryInput {
  academicYearId?: string
  search?: string
}

export interface CreateStudentGraduationRepositoryInput {
  studentId: string
  academicYearId: string
  graduationDate?: Date
  certificateNo?: string
  note?: string
}

export type UpdateStudentGraduationRepositoryInput =
  Partial<CreateStudentGraduationRepositoryInput>

export interface GraduationCandidate {
  studentId: string
  studentName: string
  nis: string
  classroomId: string
  classroomName: string
  gradeName: string
  previousHold?: {
    academicYearId: string
    academicYearName: string
    reason: string
    decidedAt: Date
  }
}

export interface BulkGraduationStudentInput {
  studentId: string
  certificateNo?: string
  note?: string
}

export interface GraduationHoldInput {
  studentId: string
  reason: string
}

export interface BulkGraduationInput {
  academicYearId: string
  graduationDate?: Date
  students: BulkGraduationStudentInput[]
  held?: GraduationHoldInput[]
}

export interface GraduationHoldRecord {
  id: string
  studentId: string
  studentName: string
  nis: string
  academicYearId: string
  academicYearName: string
  reason: string
  decidedAt: Date
}

export interface GraduationCandidateList {
  academicYear: { id: string; name: string } | null
  finalGradeName: string | null
  students: GraduationCandidate[]
}

export interface BulkGraduationResult {
  graduated: number
  skipped: number
  held: number
}

export abstract class IGraduationRepository {
  abstract findAll(
    query: StudentGraduationQueryInput,
  ): Promise<PaginatedResult<GraduationWithDetails>>
  abstract findById(id: string): Promise<GraduationWithDetails | null>
  abstract findByStudentId(
    studentId: string,
  ): Promise<StudentGraduationEntity | null>
  abstract create(
    input: CreateStudentGraduationRepositoryInput,
  ): Promise<GraduationWithDetails>
  abstract update(
    id: string,
    input: UpdateStudentGraduationRepositoryInput,
  ): Promise<GraduationWithDetails>
  abstract remove(id: string): Promise<StudentGraduationEntity>
  abstract softDelete(id: string): Promise<StudentGraduationEntity>
  abstract findCandidates(): Promise<GraduationCandidateList>
  abstract findActiveAcademicYearId(): Promise<string | null>
  abstract executeBulk(
    input: BulkGraduationInput,
  ): Promise<BulkGraduationResult>
  abstract findHolds(academicYearId?: string): Promise<GraduationHoldRecord[]>
}
