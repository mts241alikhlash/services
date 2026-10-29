import { ConflictException } from '@nestjs/common'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamPackageRepository } from '../../exam-package.repository.fake.js'
import {
  GRADE_ID,
  SUBJECT_ID,
  USER,
  seedApprovedQuestion,
} from '../../exam-package.test-support.js'
import { CreateExamPackageUseCase } from '../create-exam-package/create-exam-package.use-case.js'
import { DeleteExamPackageUseCase } from './delete-exam-package.use-case.js'

describe('DeleteExamPackageUseCase', () => {
  let packages: FakeExamPackageRepository
  let remove: DeleteExamPackageUseCase
  let packageId: string

  beforeEach(async () => {
    packages = new FakeExamPackageRepository()
    const questions = new FakeQuestionRepository()
    remove = new DeleteExamPackageUseCase(packages)
    const question = await seedApprovedQuestion(questions)
    packageId = (
      await new CreateExamPackageUseCase(packages, questions).execute(USER, {
        title: 'Paket',
        subjectId: SUBJECT_ID,
        gradeId: GRADE_ID,
        questionIds: [question.id],
      })
    ).id
  })

  it('deletes a draft package', async () => {
    await remove.execute(packageId)

    expect(await packages.findById(packageId)).toBeNull()
  })

  it('is refused once the package is locked', async () => {
    packages.lockForTest(packageId)

    await expect(remove.execute(packageId)).rejects.toThrow(ConflictException)
  })
})
