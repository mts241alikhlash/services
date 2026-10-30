import type { MakeupReason } from './exam-schedule.entity.js'

export interface ScheduleParticipant {
  scheduleId: string
  studentId: string
  reason: MakeupReason
  note: string | null
  addedById: string
  createdAt: Date
}

export interface NewParticipant {
  studentId: string
  reason: MakeupReason
  note: string | null
}
