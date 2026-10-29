import { BadRequestException, ConflictException } from '@nestjs/common'
import { REVIEWER, reviewWorld } from '../../package-review.test-support.js'
import { ReturnExamPackageUseCase } from './return-exam-package.use-case.js'

describe('ReturnExamPackageUseCase', () => {
  it('needs a note', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    const useCase = new ReturnExamPackageUseCase(world.packages)

    await expect(
      useCase.execute(REVIEWER, world.pkg.id, '   ', []),
    ).rejects.toThrow(BadRequestException)
  })

  it('returns the package and keeps the notes per question', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    const useCase = new ReturnExamPackageUseCase(world.packages)

    const result = await useCase.execute(REVIEWER, world.pkg.id, 'Perbaiki', [
      { questionId: world.questionIds[0], note: 'Kuncinya salah' },
    ])

    expect(result.status).toBe('RETURNED')
    expect(world.packages.reviews).toMatchObject([
      {
        action: 'RETURN',
        note: 'Perbaiki',
        questionNotes: [
          { questionId: world.questionIds[0], note: 'Kuncinya salah' },
        ],
      },
    ])
  })

  it('refuses a note on a question that is not in the package', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    const useCase = new ReturnExamPackageUseCase(world.packages)

    await expect(
      useCase.execute(REVIEWER, world.pkg.id, 'Perbaiki', [
        { questionId: '00000000-0000-4000-8000-000000000000', note: 'x' },
      ]),
    ).rejects.toThrow(BadRequestException)
  })

  it('refuses a package that is not submitted', async () => {
    const world = await reviewWorld()
    const useCase = new ReturnExamPackageUseCase(world.packages)

    await expect(
      useCase.execute(REVIEWER, world.pkg.id, 'Perbaiki', []),
    ).rejects.toThrow(ConflictException)
  })
})
