export const EXAM_SCHEDULE_STATUSES = ['SCHEDULED', 'CANCELLED'] as const

export const EXAM_TYPES = ['UH', 'QUIZ', 'TUGAS', 'UTS', 'UAS'] as const

export const EXAM_SCHEDULE_KINDS = ['REGULAR', 'MAKEUP'] as const

export type ExamScheduleKind = (typeof EXAM_SCHEDULE_KINDS)[number]

export const MAKEUP_REASONS = ['SICK', 'PERMITTED', 'ABSENT', 'OTHER'] as const

export type MakeupReason = (typeof MAKEUP_REASONS)[number]

export type ExamType = (typeof EXAM_TYPES)[number]

export type ExamScheduleStatus = (typeof EXAM_SCHEDULE_STATUSES)[number]

export interface ExamSchedule {
  id: string
  packageId: string
  packageTitle: string
  subjectId: string
  classroomId: string
  semesterId: string
  startsAt: Date
  endsAt: Date
  durationMinutes: number
  type: ExamType
  kind: ExamScheduleKind
  makeupOfId: string | null
  tokenRotation: number
  status: ExamScheduleStatus
  createdById: string
  createdAt: Date
  updatedAt: Date
}

export interface ExamScheduleView extends ExamSchedule {
  classroomName: string | null
  hasSessions?: boolean
}
