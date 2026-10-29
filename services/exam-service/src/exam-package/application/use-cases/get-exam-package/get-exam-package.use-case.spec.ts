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
import { REVIEWER, reviewWorld } from '../../package-review.test-support.js'
import { SubmitExamPackageUseCase } from '../submit-exam-package/submit-exam-package.use-case.js'
import { ReturnExamPackageUseCase } from '../return-exam-package/return-exam-package.use-case.js'
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
        marker: 'NEW',
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
  it('marks copies as copied or changed and lists the review history', async () => {
    const world = await reviewWorld(3)
    const [first, second] = world.questionIds
    for (const id of [first, second]) {
      const question = world.questions.questions.get(id)!
      world.questions.questions.set(id, {
        ...question,
        copiedFromQuestionId: '00000000-0000-4000-8000-000000000001',
        copiedFromVersion: 1,
      })
    }
    await world.questions.addVersion(
      second,
      {
        bodyHtml: '<p>Diubah</p>',
        content: world.questions.questions.get(second)!.current.content,
        points: 1,
      },
      'user-1',
    )
    await world.packages.changeQuestion(
      world.pkg.id,
      { expected: 'DRAFT', next: 'DRAFT' },
      second,
      {
        bodyHtml: '<p>Diubah</p>',
        content: world.questions.questions.get(second)!.current.content,
        points: 1,
      },
      'user-1',
    )
    await new SubmitExamPackageUseCase(world.packages, world.scope).execute(
      { id: 'user-1', roles: [], permissions: [] },
      world.pkg.id,
    )
    await new ReturnExamPackageUseCase(world.packages).execute(
      REVIEWER,
      world.pkg.id,
      'Perbaiki',
      [],
    )

    const view = await new GetExamPackageUseCase(
      world.packages,
      world.questions,
    ).execute(world.pkg.id)

    expect(view.items.map((item) => item.marker)).toEqual([
      'COPIED',
      'CHANGED',
      'NEW',
    ])
    expect(view.reviews.map((review) => review.action)).toEqual([
      'SUBMIT',
      'RETURN',
    ])
  })
  it('hides the draft of another teacher but shows an approved package', async () => {
    const world = await reviewWorld(1)
    const useCase = new GetExamPackageUseCase(world.packages, world.questions)
    const stranger = { id: 'user-9', canSeeAll: false }

    await expect(useCase.execute(world.pkg.id, stranger)).rejects.toThrow(
      NotFoundException,
    )

    world.setStatus('APPROVED')
    expect((await useCase.execute(world.pkg.id, stranger)).id).toBe(
      world.pkg.id,
    )
  })

  it('shows the author and a manager their own draft', async () => {
    const world = await reviewWorld(1)
    const useCase = new GetExamPackageUseCase(world.packages, world.questions)

    expect(
      (await useCase.execute(world.pkg.id, { id: 'user-1', canSeeAll: false }))
        .id,
    ).toBe(world.pkg.id)
    expect(
      (await useCase.execute(world.pkg.id, { id: 'user-9', canSeeAll: true }))
        .id,
    ).toBe(world.pkg.id)
  })
})
