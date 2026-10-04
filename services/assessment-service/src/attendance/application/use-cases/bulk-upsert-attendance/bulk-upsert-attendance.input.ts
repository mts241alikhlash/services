import { AttendanceStatus } from '../../../../shared/domain/enums/attendance-status.enum.js'

export interface BulkAttendanceRecordInput {
  enrollmentId: string
  status: AttendanceStatus
  note?: string
}

export interface BulkUpsertAttendanceInput {
  date: string
  scheduleId?: string
  records: BulkAttendanceRecordInput[]
}
