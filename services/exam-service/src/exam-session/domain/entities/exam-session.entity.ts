import type { AnswerPayload } from '../policies/validate-answer-shape.policy.js'

export const EXAM_SESSION_STATUSES = [
  'IN_PROGRESS',
  'SUBMITTED',
  'EXPIRED',
  'GRADED',
] as const

export type ExamSessionStatus = (typeof EXAM_SESSION_STATUSES)[number]

export interface ExamSession {
  id: string
  scheduleId: string
  studentId: string
  userId: string
  deviceId: string | null
  enrollmentId: string | null
  shuffleSeed: string
  startedAt: Date
  deadline: Date
  finalizeAt: Date
  status: ExamSessionStatus
  submittedAt: Date | null
  rawScore: number | null
  maxScore: number | null
  releasedAt: Date | null
  releasedById: string | null
  gradedAt: Date | null
  violationCount: number
  streamNonce: string | null
  lastSeenAt: Date | null
  cameraBlocked: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ExamAnswerRecord {
  id: string
  sessionId: string
  questionId: string
  answer: AnswerPayload
  clientId: string
  receivedAfterDeadline: boolean
  score: number | null
  gradedById: string | null
  gradedAt: Date | null
  gradeNote: string | null
  createdAt: Date
  updatedAt: Date
}

export type MyExamStatus = 'UPCOMING' | 'OPEN' | 'IN_PROGRESS' | 'FINISHED'
