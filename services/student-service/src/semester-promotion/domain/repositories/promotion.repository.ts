import { PromotionAction } from '../enums/promotion-action.enum.js'
import {
  ActiveEnrollmentWithDetails,
  ClassroomWithGrade,
  SemesterWithAcademicYear,
} from '../entities/promotion.entity.js'

export interface StudentPromotionInput {
  studentId: string
  sourceClassroomId: string
  action: PromotionAction
  targetClassroomId?: string
  declineReason?: string
}

export interface PromotionResult {
  promoted: number
  repeated: number
  skipped: number
}

export abstract class IPromotionRepository {
  abstract findSemesterWithAcademicYear(
    id: string,
  ): Promise<SemesterWithAcademicYear | null>

  abstract findEdgeSemesterOfAcademicYear(
    academicYearId: string,
    edge: 'first' | 'last',
  ): Promise<SemesterWithAcademicYear | null>

  abstract findLatestEnrolledSemesterOfAcademicYear(
    academicYearId: string,
  ): Promise<SemesterWithAcademicYear | null>

  abstract findAcademicYearName(id: string): Promise<string | null>

  abstract findClassroomById(id: string): Promise<ClassroomWithGrade | null>

  abstract findActiveEnrollmentsWithDetails(
    semesterId: string,
  ): Promise<ActiveEnrollmentWithDetails[]>

  abstract findClassesByAcademicYear(
    academicYearId: string,
  ): Promise<ClassroomWithGrade[]>

  abstract executePromotion(
    sourceSemesterId: string,
    targetSemesterId: string,
    students: StudentPromotionInput[],
  ): Promise<PromotionResult>
}
