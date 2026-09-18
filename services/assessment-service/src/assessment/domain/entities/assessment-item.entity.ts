import { PersonRef, SubjectRef } from '../../../shared/domain/entities/index.js'
import { AssessmentType } from '../../../shared/domain/enums/assessment-type.enum.js'

export interface AssessmentItemEntity {
  id: string
  teachingAssignmentId: string
  name: string
  type: `${AssessmentType}`
  weight: number
  maxScore: number
  deletedAt: Date | null
}

export interface AssessmentClassroomRef {
  id: string
  code: string
  name: string | null
  gradeId: string
  academicYearId: string
}

export interface AssessmentTeachingAssignmentRef {
  id: string
  employeeId: string
  classroomId: string
  subjectId: string
  semesterId: string
  passingScore: number | null
  subject?: SubjectRef
  classroom?: AssessmentClassroomRef
  employee?: PersonRef
}

export interface AssessmentItemWithDetails extends AssessmentItemEntity {
  teachingAssignment?: AssessmentTeachingAssignmentRef
  _count?: {
    studentScores?: number
  }
}
