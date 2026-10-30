import type { PaginatedResult } from '../../../shared/domain/interfaces/repository.interface.js'
import type { AnswerPayload } from '../policies/validate-answer-shape.policy.js'
import type {
  ExamAnswerRecord,
  ExamSession,
  ExamSessionStatus,
} from '../entities/exam-session.entity.js'

export interface SaveAnswerInput {
  sessionId: string
  questionId: string
  clientId: string
  answer: AnswerPayload
  receivedAfterDeadline: boolean
}

export interface GradeAnswerInput {
  sessionId: string
  questionId: string
  score: number
  note: string | null
  gradedById: string
  at: Date
}

export interface GradeRecompute {
  rawScore: number
  maxScore: number
  pendingManual: number
}

export interface ScheduleSessionCounts {
  sessions: number
  awaitingGrading: number
  graded: number
}

export interface SessionClosure {
  status: 'SUBMITTED' | 'EXPIRED' | 'GRADED'
  submittedAt: Date | null
  gradedAt: Date | null
  rawScore: number
  maxScore: number
  scores: { answerId: string; score: number | null }[]
  publish?: boolean
}

export interface NewExamSession {
  scheduleId: string
  studentId: string
  userId: string
  deviceId: string
  enrollmentId: string
  shuffleSeed: string
  startedAt: Date
  deadline: Date
  finalizeAt: Date
}

export abstract class IExamSessionRepository {
  abstract findById(id: string): Promise<ExamSession | null>
  abstract findByScheduleAndStudent(
    scheduleId: string,
    studentId: string,
  ): Promise<ExamSession | null>
  abstract createInitial(input: NewExamSession): Promise<ExamSession | null>
  abstract bindDevice(id: string, deviceId: string): Promise<ExamSession | null>
  abstract findAnswerByClientId(
    sessionId: string,
    clientId: string,
  ): Promise<ExamAnswerRecord | null>
  abstract upsertAnswer(
    input: SaveAnswerInput,
  ): Promise<ExamAnswerRecord | null>
  abstract close(
    id: string,
    build: (answers: ExamAnswerRecord[]) => SessionClosure,
  ): Promise<ExamSession | null>
  abstract applyGrade(
    input: GradeAnswerInput,
    recompute: (answers: ExamAnswerRecord[]) => GradeRecompute,
  ): Promise<{ answer: ExamAnswerRecord; session: ExamSession } | null>
  abstract findDueIds(
    now: Date,
    limit: number,
    excludeIds: string[],
  ): Promise<string[]>
  abstract release(
    id: string,
    byUserId: string,
    at: Date,
  ): Promise<ExamSession | null>
  abstract findPageBySchedule(
    scheduleId: string,
    page: number,
    limit: number,
    status?: ExamSessionStatus,
  ): Promise<PaginatedResult<ExamSession>>
  abstract recordViolations(id: string, count: number): Promise<void>
  abstract touchStream(id: string, nonce: string, at: Date): Promise<void>
  abstract setCameraBlocked(id: string, reason: string): Promise<void>
  abstract countsBySchedule(
    scheduleIds: string[],
  ): Promise<Map<string, ScheduleSessionCounts>>
  abstract publicationStatuses(
    sessionIds: string[],
  ): Promise<Map<string, 'PENDING' | 'SENT'>>
  abstract listAnswers(sessionId: string): Promise<ExamAnswerRecord[]>
  abstract listByStudentAndSchedules(
    studentId: string,
    scheduleIds: string[],
  ): Promise<ExamSession[]>
}
