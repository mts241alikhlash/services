import { AttendanceStatus } from '../../../../shared/domain/enums/attendance-status.enum.js'

export interface UpdateAttendanceInput {
  status?: AttendanceStatus
  note?: string
}
