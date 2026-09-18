import { AttendanceStatus } from '../../../../shared/domain/enums/attendance-status.enum.js'

export interface CreateAttendanceInput {
  enrollmentId: string
  scheduleId?: string
  date: string
  status: AttendanceStatus
  note?: string
}
