import { EnrollmentStatus } from '../../../../shared/domain/enums/enrollment-status.enum.js'
import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetStudentEnrollmentsInput extends PaginationQueryInput {
  studentId?: string
  classroomId?: string
  semesterId?: string
  academicYearId?: string
  status?: EnrollmentStatus
}
