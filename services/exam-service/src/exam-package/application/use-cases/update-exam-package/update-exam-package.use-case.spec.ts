import { ConflictException, NotFoundException } from '@nestjs/common'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamPackageRepository } from '../../exam-package.repository.fake.js'
import {
  GRADE_ID,
  SUBJECT_ID,
  USER,
  seedApprovedQuestion,
} from '../../exam-package.test-support.js'
import { CreateExamPackageUseCase } from '../create-exam-package/create-exam-package.use-case.js'
import { UpdateExamPackageUseCase } from './update-exam-package.use-case.js'

describe('UpdateExamPackageUseCase', () => {
  let packages: FakeExamPackageRepository
  let questions: FakeQuestionRepository
  let update: UpdateExamPackageUseCase
  let packageId: string
  let firstId: string
  let secondId: string

  beforeEach(async () => {
    packages = new FakeExamPackageRepository()
    questions = new FakeQuestionRepository()
    update = new UpdateExamPackageUseCase(packages, questions)
    firstId = (await seedApprovedQuestion(questions)).id
    secondId = (await seedApprovedQuestion(questions)).id
    packageId = (
      await new CreateExamPackageUseCase(packages, questions).execute(USER, {
        title: 'Awal',
        subjectId: SUBJECT_ID,
        gradeId: GRADE_ID,
        questionIds: [firstId],
      })
    ).id
  })

  it('replaces the title and the items while the package is a draft', async () => {
    const updated = await update.execute(packageId, {
      title: 'Akhir',
      questionIds: [secondId, firstId],
    })

    expect(updated.title).toBe('Akhir')
    expect(updated.items.map((item) => item.questionId)).toEqual([
      secondId,
      firstId,
    ])
  })

  it('is refused once the package is locked', async () => {
    packages.lockForTest(packageId)

    await expect(
      update.execute(packageId, { title: 'Akhir', questionIds: [firstId] }),
    ).rejects.toThrow(ConflictException)
  })

  it('answers 404 for an unknown package', async () => {
    await expect(
      update.execute('00000000-0000-4000-8000-000000000000', {
        title: 'x',
        questionIds: [firstId],
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it('renames a package whose pinned question is under revision', async () => {
    const original = await questions.findById(firstId)
    await questions.addVersion(
      firstId,
      {
        bodyHtml: '<p>revisi</p>',
        content: original!.current.content,
        points: 3,
      },
      USER.id,
    )

    const updated = await update.execute(packageId, {
      title: 'Judul baru',
      questionIds: [firstId],
    })

    expect(updated.title).toBe('Judul baru')
    expect(updated.items).toEqual([
      { questionId: firstId, questionVersion: 1, position: 1 },
    ])
  })

  it('keeps the old pin when the question is approved again at a newer version', async () => {
    const original = await questions.findById(firstId)
    await questions.addVersion(
      firstId,
      {
        bodyHtml: '<p>v2</p>',
        content: original!.current.content,
        points: 3,
      },
      USER.id,
    )
    const revised = await questions.findById(firstId)
    questions.questions.set(firstId, {
      ...revised!,
      status: 'APPROVED',
      approvedVersion: 2,
      approved: revised!.current,
    })

    const updated = await update.execute(packageId, {
      title: 'Awal',
      questionIds: [firstId, secondId],
    })

    expect(updated.items).toEqual([
      { questionId: firstId, questionVersion: 1, position: 1 },
      { questionId: secondId, questionVersion: 1, position: 2 },
    ])
  })
})
