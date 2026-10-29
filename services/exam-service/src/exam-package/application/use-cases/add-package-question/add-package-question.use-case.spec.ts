import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { TEACHER } from '../../../../question/application/question.repository.fake.js'
import {
  TRUE_FALSE_INPUT,
  packageWorld,
} from '../../package-question.test-support.js'
import { AddPackageQuestionUseCase } from './add-package-question.use-case.js'

async function setup(pairs?: { subjectId: string; gradeId: string }[]) {
  const world = await packageWorld({ pairs })
  const useCase = new AddPackageQuestionUseCase(
    world.packages,
    world.questions,
    world.scope,
    world.employees,
  )
  return { ...world, useCase }
}

describe('AddPackageQuestionUseCase', () => {
  it('adds a question with the subject and grade of the package', async () => {
    const { useCase, pkg, questions } = await setup()

    const result = await useCase.execute(TEACHER, pkg.id, TRUE_FALSE_INPUT)

    const stored = questions.questions.get(result.items[0].questionId)
    expect(stored).toMatchObject({
      packageId: pkg.id,
      subjectId: 'math',
      gradeId: 'grade-7',
      authorEmployeeId: 'emp-1',
    })
  })

  it('adds at the end and pins the current version', async () => {
    const { useCase, pkg } = await setup()

    await useCase.execute(TEACHER, pkg.id, TRUE_FALSE_INPUT)
    const result = await useCase.execute(TEACHER, pkg.id, TRUE_FALSE_INPUT)

    expect(
      result.items.map((item) => [item.position, item.questionVersion]),
    ).toEqual([
      [1, 1],
      [2, 1],
    ])
  })

  it('refuses a teacher who does not teach the subject and grade', async () => {
    const { useCase, pkg } = await setup([])

    await expect(
      useCase.execute(TEACHER, pkg.id, TRUE_FALSE_INPUT),
    ).rejects.toThrow(ForbiddenException)
  })

  it('adding to an approved package sets it back to draft', async () => {
    const { useCase, pkg, setStatus } = await setup()
    setStatus('APPROVED')

    const result = await useCase.execute(TEACHER, pkg.id, TRUE_FALSE_INPUT)

    expect(result.status).toBe('DRAFT')
  })

  it('refuses a submitted or locked package', async () => {
    const { useCase, pkg, setStatus } = await setup()

    for (const status of ['SUBMITTED', 'LOCKED'] as const) {
      setStatus(status)
      await expect(
        useCase.execute(TEACHER, pkg.id, TRUE_FALSE_INPUT),
      ).rejects.toThrow(ConflictException)
    }
  })

  it('refuses a package that does not exist', async () => {
    const { useCase } = await setup()

    await expect(
      useCase.execute(
        TEACHER,
        '00000000-0000-4000-8000-000000000000',
        TRUE_FALSE_INPUT,
      ),
    ).rejects.toThrow(NotFoundException)
  })
})
