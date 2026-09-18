import { PersonRef } from '../../../shared/domain/entities/index.js'

export interface StudentEnrollmentEntity {
  id: string
  studentId: string
  classroomId: string
  semesterId: string
  enrolledAt: Date
  status?: string
  deletedAt?: Date | null
}

export interface EnrollmentClassroomRef {
  id: string
  code: string
  name: string | null
  displayName: string
  gradeId: string
  academicYearId: string
  capacity: number
  grade: { level: number; name: string } | null
}

export interface EnrollmentSemesterRef {
  id: string
  academicYearId: string
  isActive: boolean
  type: { id: string; name: string } | null
  academicYear: { id: string; name: string } | null
}

export interface EnrollmentWithDetails extends StudentEnrollmentEntity {
  student?: PersonRef
  classroom?: EnrollmentClassroomRef
  semester?: EnrollmentSemesterRef
}
