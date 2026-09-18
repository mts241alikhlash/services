import { AttendanceStatus } from '../../../../shared/domain/enums/attendance-status.enum.js'
import { PaginationQueryInput } from '../../../../shared/domain/interfaces/repository.interface.js'

export interface GetAttendancesInput extends PaginationQueryInput {
  status?: AttendanceStatus
  enrollmentId?: string
  scheduleId?: string
  classroomId?: string
  semesterId?: string
  date?: string
}
