import { NotFoundException } from '@nestjs/common'
import { reviewWorld } from '../../package-review.test-support.js'
import { GetPackageQuestionUseCase } from './get-package-question.use-case.js'

const STRANGER = { id: 'user-9', canSeeAll: false }

describe('GetPackageQuestionUseCase', () => {
  it('shows the question of a package to its author', async () => {
    const world = await reviewWorld(1)
    const useCase = new GetPackageQuestionUseCase(
      world.packages,
      world.questions,
    )

    const question = await useCase.execute(
      { id: 'user-1', canSeeAll: false },
      world.pkg.id,
      world.questionIds[0],
    )

    expect(question.id).toBe(world.questionIds[0])
    expect(question.current.bodyHtml).toContain('Bumi bulat')
  })

  it('hides the question of another teacher’s draft', async () => {
    const world = await reviewWorld(1)
    const useCase = new GetPackageQuestionUseCase(
      world.packages,
      world.questions,
    )

    await expect(
      useCase.execute(STRANGER, world.pkg.id, world.questionIds[0]),
    ).rejects.toThrow(NotFoundException)
  })

  it('shows it once the package is approved, and always to a manager', async () => {
    const world = await reviewWorld(1)
    const useCase = new GetPackageQuestionUseCase(
      world.packages,
      world.questions,
    )

    expect(
      (
        await useCase.execute(
          { id: 'user-9', canSeeAll: true },
          world.pkg.id,
          world.questionIds[0],
        )
      ).id,
    ).toBe(world.questionIds[0])

    world.setStatus('APPROVED')
    expect(
      (await useCase.execute(STRANGER, world.pkg.id, world.questionIds[0])).id,
    ).toBe(world.questionIds[0])
  })

  it('refuses a question that is not in the package, or was removed', async () => {
    const world = await reviewWorld(2)
    const useCase = new GetPackageQuestionUseCase(
      world.packages,
      world.questions,
    )
    const author = { id: 'user-1', canSeeAll: false }

    await expect(
      useCase.execute(
        author,
        world.pkg.id,
        '00000000-0000-4000-8000-000000000000',
      ),
    ).rejects.toThrow(NotFoundException)

    const removed = world.questions.questions.get(world.questionIds[1])!
    world.questions.questions.set(removed.id, {
      ...removed,
      deletedAt: new Date(),
    })
    await expect(
      useCase.execute(author, world.pkg.id, removed.id),
    ).rejects.toThrow(NotFoundException)
  })
})
