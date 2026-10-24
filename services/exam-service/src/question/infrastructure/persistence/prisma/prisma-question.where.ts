import type { Prisma } from '../../../../generated/prisma/client.js'
import type { QuestionListQuery } from '../../../domain/repositories/question.repository.js'

export function buildQuestionWhere(
  query: QuestionListQuery,
): Prisma.QuestionWhereInput {
  const and: Prisma.QuestionWhereInput[] = [{ deletedAt: null }]

  if (query.pairs !== null) {
    and.push({
      OR: query.pairs.map((pair) => ({
        subjectId: pair.subjectId,
        gradeId: pair.gradeId,
      })),
    })
  }
  if (query.subjectId) and.push({ subjectId: query.subjectId })
  if (query.gradeId) and.push({ gradeId: query.gradeId })
  if (query.type) and.push({ type: query.type })
  if (query.status) and.push({ status: query.status })
  if (query.authorEmployeeId) {
    and.push({ authorEmployeeId: query.authorEmployeeId })
  }
  if (query.search) {
    and.push({
      versions: {
        some: { bodyHtml: { contains: query.search, mode: 'insensitive' } },
      },
    })
  }

  return { AND: and }
}
