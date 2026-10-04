import { EnrollmentStatus } from '../../../../shared/domain/enums/enrollment-status.enum.js'

export interface UpdateStudentEnrollmentInput {
  studentId?: string
  classroomId?: string
  semesterId?: string
  status?: EnrollmentStatus
  endedAt?: string
  note?: string
}
