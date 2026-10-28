import { randomUUID } from 'node:crypto'
import type { FakeQuestionRepository } from '../../question/application/question.repository.fake.js'
import type { QuestionDetail } from '../../question/domain/entities/question.entity.js'

export const SUBJECT_ID = '11111111-1111-4111-8111-111111111111'
export const GRADE_ID = '22222222-2222-4222-8222-222222222222'
export const USER = { id: '99999999-9999-4999-8999-999999999999' }

export async function seedApprovedQuestion(
  questions: FakeQuestionRepository,
  overrides: { subjectId?: string; gradeId?: string; bodyHtml?: string } = {},
): Promise<QuestionDetail> {
  const created = await questions.create({
    subjectId: overrides.subjectId ?? SUBJECT_ID,
    gradeId: overrides.gradeId ?? GRADE_ID,
    authorEmployeeId: randomUUID(),
    type: 'TRUE_FALSE',
    createdById: USER.id,
    bodyHtml: overrides.bodyHtml ?? '<p>Langit berwarna biru</p>',
    content: { answer: { value: true } },
    points: 2,
  })
  const approved: QuestionDetail = {
    ...created,
    status: 'APPROVED',
    approvedVersion: 1,
    approved: created.current,
  }
  questions.questions.set(approved.id, approved)
  return approved
}
