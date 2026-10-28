import type { Prisma } from '../../../../generated/prisma/client.js'
import type {
  ExamAnswerRecord,
  ExamSession,
} from '../../../domain/entities/exam-session.entity.js'
import type { AnswerPayload } from '../../../domain/policies/validate-answer-shape.policy.js'

type SessionRow = Prisma.ExamSessionGetPayload<object>
type AnswerRow = Prisma.ExamAnswerGetPayload<object>

export function toSession(row: SessionRow): ExamSession {
  return {
    id: row.id,
    scheduleId: row.scheduleId,
    studentId: row.studentId,
    userId: row.userId,
    deviceId: row.deviceId,
    shuffleSeed: row.shuffleSeed,
    startedAt: row.startedAt,
    deadline: row.deadline,
    finalizeAt: row.finalizeAt,
    status: row.status,
    submittedAt: row.submittedAt,
    rawScore: row.rawScore,
    maxScore: row.maxScore,
    releasedAt: row.releasedAt,
    releasedById: row.releasedById,
    gradedAt: row.gradedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function toAnswer(row: AnswerRow): ExamAnswerRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    questionId: row.questionId,
    answer: row.answer as unknown as AnswerPayload,
    clientId: row.clientId,
    receivedAfterDeadline: row.receivedAfterDeadline,
    score: row.score,
    gradedById: row.gradedById,
    gradedAt: row.gradedAt,
    gradeNote: row.gradeNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
