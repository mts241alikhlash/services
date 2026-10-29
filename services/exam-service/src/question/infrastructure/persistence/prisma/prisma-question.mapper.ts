import type { Prisma } from '../../../../generated/prisma/client.js'
import type {
  QuestionDetail,
  QuestionVersion,
} from '../../../domain/entities/question.entity.js'
import type { QuestionContent } from '../../../domain/value-objects/question-content.js'

export const QUESTION_INCLUDE = {
  versions: true,
} satisfies Prisma.QuestionInclude

type VersionRow = Prisma.QuestionVersionGetPayload<object>
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

export function toDetail(row: DetailRow): QuestionDetail {
  const current = row.versions.find(
    (candidate) => candidate.number === row.currentVersion,
  )
  if (!current) {
    throw new Error(`Question ${row.id} has no version ${row.currentVersion}`)
  }
  return {
    id: row.id,
    packageId: row.packageId,
    copiedFromQuestionId: row.copiedFromQuestionId,
    copiedFromVersion: row.copiedFromVersion,
    subjectId: row.subjectId,
    gradeId: row.gradeId,
    authorEmployeeId: row.authorEmployeeId,
    type: row.type,
    currentVersion: row.currentVersion,
    revision: row.revision,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    current: toVersion(current),
  }
}
