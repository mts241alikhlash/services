import type { Prisma } from '../../../../generated/prisma/client.js'
import type {
  Question,
  QuestionDetail,
  QuestionReview,
  QuestionVersion,
} from '../../../domain/entities/question.entity.js'
import type { QuestionSummary } from '../../../domain/repositories/question.repository.js'
import type { QuestionContent } from '../../../domain/value-objects/question-content.js'

export const QUESTION_INCLUDE = {
  versions: true,
  reviews: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.QuestionInclude

type VersionRow = Prisma.QuestionVersionGetPayload<object>
type QuestionRow = Prisma.QuestionGetPayload<{
  include: { versions: true }
}>
type DetailRow = Prisma.QuestionGetPayload<{
  include: typeof QUESTION_INCLUDE
}>

export function toVersion(row: VersionRow): QuestionVersion {
  return {
    id: row.id,
    questionId: row.questionId,
    number: row.number,
    bodyHtml: row.bodyHtml,
    content: row.content as unknown as QuestionContent,
    points: row.points,
    createdById: row.createdById,
    createdAt: row.createdAt,
  }
}

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    packageId: row.packageId,
    copiedFromQuestionId: row.copiedFromQuestionId,
    copiedFromVersion: row.copiedFromVersion,
    subjectId: row.subjectId,
    gradeId: row.gradeId,
    authorEmployeeId: row.authorEmployeeId,
    type: row.type,
    status: row.status,
    currentVersion: row.currentVersion,
    approvedVersion: row.approvedVersion,
    revision: row.revision,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}

function pick(row: QuestionRow, number: number): QuestionVersion {
  const version = row.versions.find((candidate) => candidate.number === number)
  if (!version) {
    throw new Error(`Question ${row.id} has no version ${number}`)
  }
  return toVersion(version)
}

export function toDetail(row: DetailRow): QuestionDetail {
  return {
    ...toQuestion(row),
    current: pick(row, row.currentVersion),
    approved:
      row.approvedVersion === null ? null : pick(row, row.approvedVersion),
    reviews: row.reviews.map((review): QuestionReview => ({
      id: review.id,
      questionId: review.questionId,
      versionNumber: review.versionNumber,
      action: review.action,
      note: review.note,
      byUserId: review.byUserId,
      createdAt: review.createdAt,
    })),
  }
}

export function toSummary(row: QuestionRow): QuestionSummary {
  const current = pick(row, row.currentVersion)
  return {
    ...toQuestion(row),
    bodyHtml: current.bodyHtml,
    points: current.points,
  }
}
