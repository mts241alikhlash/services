import type { PersonRef } from '../../../shared/domain/entities/index.js'
import type { AssessmentItemWithDetails } from './assessment-item.entity.js'

export interface StudentScoreEntity {
  id: string
  enrollmentId: string
  assessmentItemId: string
  score: number | null
  note: string | null
  correctedById: string | null
  correctedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface ScoredEnrollmentRef {
  id: string
  studentId: string
  classroomId: string
  semesterId: string
  student?: PersonRef
}

export interface StudentScoreWithDetails extends StudentScoreEntity {
  assessmentItem?: AssessmentItemWithDetails
  enrollment?: ScoredEnrollmentRef
}
