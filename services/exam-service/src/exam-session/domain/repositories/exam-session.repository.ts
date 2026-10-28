import type { PaginatedResult } from '../../../shared/domain/interfaces/repository.interface.js'
import type { AnswerPayload } from '../policies/validate-answer-shape.policy.js'
import type {
  ExamAnswerRecord,
  ExamSession,
} from '../entities/exam-session.entity.js'

export interface SaveAnswerInput {
  sessionId: string
  questionId: string
  clientId: string
  answer: AnswerPayload
  receivedAfterDeadline: boolean
}

export interface SessionClosure {
  status: 'SUBMITTED' | 'EXPIRED' | 'GRADED'
  submittedAt: Date | null
  gradedAt: Date | null
  rawScore: number
  maxScore: number
  scores: { answerId: string; score: number | null }[]
}

export interface NewExamSession {
  scheduleId: string
  studentId: string
  userId: string
  deviceId: string
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
  ): Promise<PaginatedResult<ExamSession>>
  abstract listAnswers(sessionId: string): Promise<ExamAnswerRecord[]>
  abstract listByStudentAndSchedules(
    studentId: string,
    scheduleIds: string[],
  ): Promise<ExamSession[]>
}
