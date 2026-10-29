import { BadRequestException, ForbiddenException } from '@nestjs/common'
import {
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../../../question/application/question.repository.fake.js'
import { FakeExamPackageRepository } from '../../exam-package.repository.fake.js'
import { CreateDraftPackageUseCase } from './create-draft-package.use-case.js'

function setup(pairs = [MATH_7]) {
  const packages = new FakeExamPackageRepository()
  const { scope } = buildTeacherScope({ employeeId: 'emp-1', pairs })
  return { packages, useCase: new CreateDraftPackageUseCase(packages, scope) }
}

describe('CreateDraftPackageUseCase', () => {
  it('creates an empty draft owned by the caller', async () => {
    const { useCase } = setup()

    const created = await useCase.execute(TEACHER, {
      title: '  UTS Matematika  ',
      ...MATH_7,
    })

    expect(created).toMatchObject({
      title: 'UTS Matematika',
      status: 'DRAFT',
      createdById: TEACHER.id,
      subjectId: 'math',
      gradeId: 'grade-7',
      items: [],
    })
  })

  it('refuses a blank title', async () => {
    const { useCase } = setup()

    await expect(
      useCase.execute(TEACHER, { title: '   ', ...MATH_7 }),
    ).rejects.toThrow(BadRequestException)
  })

  it('refuses a teacher who does not teach the subject and grade', async () => {
    const { useCase } = setup([])

    await expect(
      useCase.execute(TEACHER, { title: 'UTS', ...MATH_7 }),
    ).rejects.toThrow(ForbiddenException)
  })
})
