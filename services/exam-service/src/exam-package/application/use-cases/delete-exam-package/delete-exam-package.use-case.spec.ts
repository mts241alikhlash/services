import { ConflictException } from '@nestjs/common'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamPackageRepository } from '../../exam-package.repository.fake.js'
import { USER, seedPackage } from '../../exam-package.test-support.js'
import { DeleteExamPackageUseCase } from './delete-exam-package.use-case.js'

const OWNER = { id: USER.id, roles: [], permissions: [] }

describe('DeleteExamPackageUseCase', () => {
  let packages: FakeExamPackageRepository
  let remove: DeleteExamPackageUseCase
  let packageId: string

  beforeEach(async () => {
    packages = new FakeExamPackageRepository(new FakeQuestionRepository())
    const questions = new FakeQuestionRepository()
    remove = new DeleteExamPackageUseCase(packages)
    packageId = (await seedPackage(packages, questions, [{}], 'DRAFT')).id
  })

  it('deletes a draft package', async () => {
    await remove.execute(OWNER, packageId)

    expect(await packages.findById(packageId)).toBeNull()
  })

  it('is refused once the package is locked', async () => {
    packages.lockForTest(packageId)

    await expect(remove.execute(OWNER, packageId)).rejects.toThrow(
      ConflictException,
    )
  })
  it('deletes a returned or an approved package', async () => {
    for (const status of ['RETURNED', 'APPROVED'] as const) {
      const row = packages.packages.get(packageId)!
      packages.packages.set(packageId, { ...row, status })

      await remove.execute(OWNER, packageId)

      expect(await packages.findById(packageId)).toBeNull()
      packages.packages.set(packageId, { ...row, status, deletedAt: null })
    }
  })

  it('is refused while the package waits for review', async () => {
    const row = packages.packages.get(packageId)!
    packages.packages.set(packageId, { ...row, status: 'SUBMITTED' })

    await expect(remove.execute(OWNER, packageId)).rejects.toThrow(
      ConflictException,
    )
  })
})
