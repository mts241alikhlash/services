import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { AUTHOR, reviewWorld } from '../../package-review.test-support.js'
import { RenameExamPackageUseCase } from './rename-exam-package.use-case.js'

describe('RenameExamPackageUseCase', () => {
  it('renames a draft', async () => {
    const world = await reviewWorld(1)
    const useCase = new RenameExamPackageUseCase(world.packages, world.scope)

    const result = await useCase.execute(AUTHOR, world.pkg.id, ' UAS ')

    expect(result.title).toBe('UAS')
    expect(result.status).toBe('DRAFT')
  })

  it('renaming an approved package returns it to draft', async () => {
    const world = await reviewWorld(1)
    world.setStatus('APPROVED')
    const useCase = new RenameExamPackageUseCase(world.packages, world.scope)

    expect((await useCase.execute(AUTHOR, world.pkg.id, 'UAS')).status).toBe(
      'DRAFT',
    )
  })

  it('refuses a submitted or locked package', async () => {
    const world = await reviewWorld(1)
    const useCase = new RenameExamPackageUseCase(world.packages, world.scope)

    for (const status of ['SUBMITTED', 'LOCKED'] as const) {
      world.setStatus(status)
      await expect(
        useCase.execute(AUTHOR, world.pkg.id, 'UAS'),
      ).rejects.toThrow(ConflictException)
    }
  })

  it('refuses a blank title and an unknown package', async () => {
    const world = await reviewWorld(1)
    const useCase = new RenameExamPackageUseCase(world.packages, world.scope)

    await expect(useCase.execute(AUTHOR, world.pkg.id, '  ')).rejects.toThrow(
      BadRequestException,
    )
    await expect(
      useCase.execute(AUTHOR, '00000000-0000-4000-8000-000000000000', 'UAS'),
    ).rejects.toThrow(NotFoundException)
  })
})
