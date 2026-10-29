import { ConflictException, ForbiddenException } from '@nestjs/common'
import {
  ADMIN,
  REVIEWER,
  reviewWorld,
} from '../../package-review.test-support.js'
import { ApproveExamPackageUseCase } from './approve-exam-package.use-case.js'

describe('ApproveExamPackageUseCase', () => {
  it('moves a submitted package to approved with the note', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    const useCase = new ApproveExamPackageUseCase(world.packages)

    const result = await useCase.execute(REVIEWER, world.pkg.id, 'Bagus')

    expect(result.status).toBe('APPROVED')
    expect(world.packages.reviews).toMatchObject([
      { action: 'APPROVE', byUserId: REVIEWER.id, note: 'Bagus' },
    ])
  })

  it('refuses a package that is not submitted', async () => {
    const world = await reviewWorld()
    const useCase = new ApproveExamPackageUseCase(world.packages)

    await expect(useCase.execute(REVIEWER, world.pkg.id)).rejects.toThrow(
      ConflictException,
    )
  })

  it('an approver cannot approve their own package', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    const useCase = new ApproveExamPackageUseCase(world.packages)

    await expect(
      useCase.execute({ ...REVIEWER, id: world.pkg.createdById }, world.pkg.id),
    ).rejects.toThrow(ForbiddenException)
  })

  it('an administrator cannot approve a package they wrote either', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    const useCase = new ApproveExamPackageUseCase(world.packages)

    await expect(
      useCase.execute({ ...ADMIN, id: world.pkg.createdById }, world.pkg.id),
    ).rejects.toThrow(ForbiddenException)
  })

  it('an administrator who did not write it can', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    const useCase = new ApproveExamPackageUseCase(world.packages)

    const result = await useCase.execute(
      { ...ADMIN, id: 'someone-else' },
      world.pkg.id,
    )

    expect(result.status).toBe('APPROVED')
  })

  it('a second approval of the same package conflicts', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    const useCase = new ApproveExamPackageUseCase(world.packages)
    await useCase.execute(REVIEWER, world.pkg.id)

    await expect(useCase.execute(REVIEWER, world.pkg.id)).rejects.toThrow(
      ConflictException,
    )
  })

  it('loses a race against another review with a conflict', async () => {
    const world = await reviewWorld()
    world.setStatus('SUBMITTED')
    jest.spyOn(world.packages, 'transition').mockResolvedValue(false)
    const useCase = new ApproveExamPackageUseCase(world.packages)

    await expect(useCase.execute(REVIEWER, world.pkg.id)).rejects.toThrow(
      ConflictException,
    )
  })
})
