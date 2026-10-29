import { ConflictException, ForbiddenException } from '@nestjs/common'
import { AUTHOR, reviewWorld } from '../../package-review.test-support.js'
import { packageWorld } from '../../package-question.test-support.js'
import { SubmitExamPackageUseCase } from './submit-exam-package.use-case.js'

describe('SubmitExamPackageUseCase', () => {
  it('moves a draft to submitted and records the review', async () => {
    const world = await reviewWorld()
    const useCase = new SubmitExamPackageUseCase(world.packages, world.scope)

    const result = await useCase.execute(AUTHOR, world.pkg.id)

    expect(result.status).toBe('SUBMITTED')
    expect(world.packages.reviews).toMatchObject([
      { packageId: world.pkg.id, action: 'SUBMIT', byUserId: AUTHOR.id },
    ])
  })

  it('submits again after a return', async () => {
    const world = await reviewWorld()
    world.setStatus('RETURNED')
    const useCase = new SubmitExamPackageUseCase(world.packages, world.scope)

    expect((await useCase.execute(AUTHOR, world.pkg.id)).status).toBe(
      'SUBMITTED',
    )
  })

  it('refuses an empty package', async () => {
    const world = await packageWorld()
    const useCase = new SubmitExamPackageUseCase(world.packages, world.scope)

    await expect(useCase.execute(AUTHOR, world.pkg.id)).rejects.toThrow(
      'Paket belum berisi soal',
    )
  })

  it('refuses a package that is already submitted', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    const useCase = new SubmitExamPackageUseCase(world.packages, world.scope)

    await expect(useCase.execute(AUTHOR, world.pkg.id)).rejects.toThrow(
      ConflictException,
    )
  })

  it('refuses a teacher outside the subject and grade', async () => {
    const world = await reviewWorld()
    const outsider = await packageWorld({ pairs: [] })
    const useCase = new SubmitExamPackageUseCase(world.packages, outsider.scope)

    await expect(useCase.execute(AUTHOR, world.pkg.id)).rejects.toThrow(
      ForbiddenException,
    )
  })

  it('loses a race against another change with a conflict', async () => {
    const world = await reviewWorld()
    jest.spyOn(world.packages, 'transition').mockResolvedValue(false)
    const useCase = new SubmitExamPackageUseCase(world.packages, world.scope)

    await expect(useCase.execute(AUTHOR, world.pkg.id)).rejects.toThrow(
      ConflictException,
    )
  })
})
