import { AssessmentType } from '@prisma/client'
import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../../shared/domain/interfaces/repository.interface.js'
import { StudentScoreEntity } from '../entities/student-score.entity.js'
import { StudentScoreWithDetails } from '../entities/student-score.entity.js'

export type { StudentScoreWithDetails }

export interface ReportCardScoreRow {
  id: string
  enrollmentId: string
  assessmentItemId: string
  score: number | null
  note?: string | null
  assessmentItem: {
    id: string
    name: string
    type: AssessmentType
    weight?: number | null
    maxScore?: number | null
    teachingAssignment: {
      id: string
      passingScore?: number | null
      subject: {
        id: string
        name: string
        code?: string | null
      }
      classroom: {
        gradeId: string
        academicYearId: string
      }
      assessmentWeights: { type: AssessmentType; weight: number }[]
    }
  }
}

export interface StudentScoreRosterItem {
  enrollmentId: string
  studentName: string
  nis: string
  scoreId: string | null
  score: number | null
  note: string | null
}

export interface StudentScoreQueryInput extends PaginationQueryInput {
  assessmentItemId?: string
  enrollmentId?: string
  classroomId?: string
  semesterId?: string
  studentId?: string
}

export interface CreateStudentScoreRepositoryInput {
  enrollmentId: string
  assessmentItemId: string
  score?: number | null
  note?: string | null
}

export interface UpdateStudentScoreRepositoryInput {
  score?: number | null
  note?: string | null
}

export interface BulkStudentScoreRecord {
  enrollmentId: string
  score?: number | null
  note?: string | null
}

export interface BulkUpsertResult {
  saved: number
}

export abstract class IStudentScoreRepository {
  abstract findAll(
    query: StudentScoreQueryInput,
  ): Promise<PaginatedResult<StudentScoreWithDetails>>
  abstract findById(id: string): Promise<StudentScoreWithDetails | null>
  abstract findScore(
    assessmentItemId: string,
    studentEnrollmentId: string,
    excludeId?: string,
  ): Promise<StudentScoreEntity | null>
  abstract create(
    input: CreateStudentScoreRepositoryInput,
  ): Promise<StudentScoreWithDetails>
  abstract update(
    id: string,
    input: UpdateStudentScoreRepositoryInput,
  ): Promise<StudentScoreWithDetails>
  abstract remove(id: string): Promise<StudentScoreEntity>
  abstract softDelete(id: string): Promise<StudentScoreEntity>
  abstract restore(
    id: string,
    input?: UpdateStudentScoreRepositoryInput,
  ): Promise<StudentScoreEntity>
  abstract findDuplicate(
    enrollmentId: string,
    assessmentItemId: string,
    excludeId?: string,
  ): Promise<StudentScoreEntity | null>
  abstract findSoftDeleted(
    enrollmentId: string,
    assessmentItemId: string,
  ): Promise<StudentScoreEntity | null>
  abstract bulkUpsert(
    assessmentItemId: string,
    records: BulkStudentScoreRecord[],
    correctedById?: string | null,
  ): Promise<BulkUpsertResult>
  abstract getRoster(
    assessmentItemId: string,
    classroomId?: string,
    semesterId?: string,
  ): Promise<StudentScoreRosterItem[]>
  abstract findAllForReportCard(
    enrollmentId: string,
  ): Promise<ReportCardScoreRow[]>
}
