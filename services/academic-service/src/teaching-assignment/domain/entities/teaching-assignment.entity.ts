import {
  ClassroomRef,
  PersonRef,
  SemesterRef,
  SubjectRef,
} from '../../../shared/domain/entities/index.js'

export interface TeachingAssignmentEntity {
  id: string
  employeeId: string
  subjectId: string
  classroomId: string
  semesterId: string
  deletedAt?: Date | null
}

export interface TeachingAssignmentWithDetails extends TeachingAssignmentEntity {
  employee?: PersonRef
  subject?: SubjectRef
  classroom?: ClassroomRef
  semester?: SemesterRef
}
