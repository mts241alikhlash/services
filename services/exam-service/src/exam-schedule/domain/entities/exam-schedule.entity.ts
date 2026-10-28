export const EXAM_SCHEDULE_STATUSES = ['SCHEDULED', 'CANCELLED'] as const

export type ExamScheduleStatus = (typeof EXAM_SCHEDULE_STATUSES)[number]

export interface ExamSchedule {
  id: string
  packageId: string
  packageTitle: string
  classroomId: string
  semesterId: string
  startsAt: Date
  endsAt: Date
  durationMinutes: number
  tokenRotation: number
  status: ExamScheduleStatus
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export interface ExamScheduleView extends ExamSchedule {
  classroomName: string | null
}
