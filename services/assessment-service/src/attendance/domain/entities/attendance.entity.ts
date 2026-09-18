import { AttendanceStatus } from '../../../shared/domain/enums/attendance-status.enum.js'
import { PersonRef } from '../../../shared/domain/entities/reference.entity.js'

export type AttendanceStatusEnum = `${AttendanceStatus}`

export interface AttendanceEntity {
  id: string
  enrollmentId: string
  scheduleId?: string | null
  date: Date
  status: AttendanceStatusEnum
  note?: string | null
  deletedAt?: Date | null
}

export interface AttendanceScheduleRef {
  id: string
  teachingAssignmentId: string
  timeSlotId: string
  teachingAssignment?: {
    id: string
    subject?: { id: string; code: string | null; name: string }
    classroom?: { id: string; code: string; name: string | null }
  }
}

export interface AttendanceEnrollmentRef {
  id: string
  studentId: string
  classroomId: string
  semesterId: string
  student?: PersonRef
}

export interface AttendanceWithDetails extends AttendanceEntity {
  schedule?: AttendanceScheduleRef | null
  enrollment?: AttendanceEnrollmentRef
}
