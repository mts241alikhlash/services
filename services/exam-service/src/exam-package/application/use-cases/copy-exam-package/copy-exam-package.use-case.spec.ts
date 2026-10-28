import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamPackageRepository } from '../../exam-package.repository.fake.js'
import {
  GRADE_ID,
  SUBJECT_ID,
  USER,
  seedApprovedQuestion,
} from '../../exam-package.test-support.js'
import { CreateExamPackageUseCase } from '../create-exam-package/create-exam-package.use-case.js'
import { CopyExamPackageUseCase } from './copy-exam-package.use-case.js'

describe('CopyExamPackageUseCase', () => {
  it('produces a draft with the same pinned versions, even from a locked package', async () => {
    const packages = new FakeExamPackageRepository()
    const questions = new FakeQuestionRepository()
    const question = await seedApprovedQuestion(questions)
    const original = await new CreateExamPackageUseCase(
      packages,
      questions,
    ).execute(USER, {
      title: 'UTS',
      subjectId: SUBJECT_ID,
      gradeId: GRADE_ID,
      questionIds: [question.id],
    })
    packages.lockForTest(original.id)

    const copy = await new CopyExamPackageUseCase(packages).execute(
      { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
      original.id,
    )

    expect(copy.id).not.toBe(original.id)
    expect(copy.status).toBe('DRAFT')
    expect(copy.title).toBe('Salinan UTS')
    expect(copy.createdById).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    expect(copy.items).toEqual(original.items)
  })

  it('cuts the title to 200 characters', async () => {
    const packages = new FakeExamPackageRepository()
    const questions = new FakeQuestionRepository()
    const question = await seedApprovedQuestion(questions)
    const original = await new CreateExamPackageUseCase(
      packages,
      questions,
    ).execute(USER, {
      title: 'x'.repeat(200),
      subjectId: SUBJECT_ID,
      gradeId: GRADE_ID,
      questionIds: [question.id],
    })

    const copy = await new CopyExamPackageUseCase(packages).execute(
      USER,
      original.id,
    )

    expect(copy.title).toHaveLength(200)
  })
})
