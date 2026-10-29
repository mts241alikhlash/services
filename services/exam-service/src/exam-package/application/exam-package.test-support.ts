import { randomUUID } from 'node:crypto'
import type { FakeQuestionRepository } from '../../question/application/question.repository.fake.js'
import type {
  QuestionContent,
  QuestionType,
} from '../../question/domain/value-objects/question-content.js'
import type {
  ExamPackageDetail,
  ExamPackageStatus,
  PackageItem,
} from '../domain/entities/exam-package.entity.js'
import type { FakeExamPackageRepository } from './exam-package.repository.fake.js'

export const SUBJECT_ID = '11111111-1111-4111-8111-111111111111'
export const GRADE_ID = '22222222-2222-4222-8222-222222222222'
export const USER = { id: '99999999-9999-4999-8999-999999999999' }

export interface QuestionSpec {
  bodyHtml?: string
  type?: QuestionType
  content?: QuestionContent
  points?: number
}

export async function seedPackage(
  packages: FakeExamPackageRepository,
  questions: FakeQuestionRepository,
  specs: QuestionSpec[] = [{}],
  status: ExamPackageStatus = 'APPROVED',
  scope: { subjectId?: string; gradeId?: string; title?: string } = {},
): Promise<ExamPackageDetail> {
  const subjectId = scope.subjectId ?? SUBJECT_ID
  const gradeId = scope.gradeId ?? GRADE_ID
  const pkg = await packages.create({
    title: scope.title ?? 'UTS Matematika Kelas 7',
    subjectId,
    gradeId,
    createdById: USER.id,
    items: [],
  })
  const items: PackageItem[] = []
  for (const spec of specs) {
    const question = await questions.create({
      packageId: pkg.id,
      subjectId,
      gradeId,
      authorEmployeeId: randomUUID(),
      type: spec.type ?? 'TRUE_FALSE',
      createdById: USER.id,
      bodyHtml: spec.bodyHtml ?? '<p>Langit berwarna biru</p>',
      content: spec.content ?? { answer: { value: true } },
      points: spec.points ?? 2,
    })
    items.push({
      questionId: question.id,
      questionVersion: 1,
      position: items.length + 1,
    })
  }
  const seeded = { ...pkg, status, items }
  packages.packages.set(pkg.id, seeded)
  return seeded
}
