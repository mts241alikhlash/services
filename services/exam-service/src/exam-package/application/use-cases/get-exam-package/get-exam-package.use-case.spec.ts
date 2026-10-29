import { NotFoundException } from '@nestjs/common'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamPackageRepository } from '../../exam-package.repository.fake.js'
import {
  GRADE_ID,
  SUBJECT_ID,
  USER,
  seedApprovedQuestion,
} from '../../exam-package.test-support.js'
import { CreateExamPackageUseCase } from '../create-exam-package/create-exam-package.use-case.js'
import { GetExamPackageUseCase } from './get-exam-package.use-case.js'

describe('GetExamPackageUseCase', () => {
  it('shows each item from the version that was pinned, not the latest one', async () => {
    const packages = new FakeExamPackageRepository()
    const questions = new FakeQuestionRepository()
    const question = await seedApprovedQuestion(questions, {
      bodyHtml: '<p>Versi <b>satu</b></p>',
    })
    const created = await new CreateExamPackageUseCase(
      packages,
      questions,
    ).execute(USER, {
      title: 'Paket',
      subjectId: SUBJECT_ID,
      gradeId: GRADE_ID,
      questionIds: [question.id],
    })
    await questions.addVersion(
      question.id,
      {
        bodyHtml: '<p>Versi dua</p>',
        content: question.current.content,
        points: 5,
      },
      USER.id,
    )

    const view = await new GetExamPackageUseCase(packages, questions).execute(
      created.id,
    )

    expect(view.items).toEqual([
      {
        questionId: question.id,
        questionVersion: 1,
        position: 1,
        type: 'TRUE_FALSE',
        summary: 'Versi satu',
        points: 2,
      },
    ])
  })

  it('answers 404 for an unknown package', async () => {
    await expect(
      new GetExamPackageUseCase(
        new FakeExamPackageRepository(),
        new FakeQuestionRepository(),
      ).execute('00000000-0000-4000-8000-000000000000'),
    ).rejects.toThrow(NotFoundException)
  })
})
