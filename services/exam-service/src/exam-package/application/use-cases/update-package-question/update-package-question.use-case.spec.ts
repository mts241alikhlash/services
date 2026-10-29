import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { TEACHER } from '../../../../question/application/question.repository.fake.js'
import {
  TRUE_FALSE_INPUT,
  packageWorld,
} from '../../package-question.test-support.js'
import { AddPackageQuestionUseCase } from '../add-package-question/add-package-question.use-case.js'
import { UpdatePackageQuestionUseCase } from './update-package-question.use-case.js'

async function setup() {
  const world = await packageWorld()
  const add = new AddPackageQuestionUseCase(
    world.packages,
    world.questions,
    world.scope,
    world.employees,
  )
  const added = await add.execute(TEACHER, world.pkg.id, TRUE_FALSE_INPUT)
  const useCase = new UpdatePackageQuestionUseCase(
    world.packages,
    world.questions,
    world.scope,
  )
  return { ...world, useCase, questionId: added.items[0].questionId }
}

describe('UpdatePackageQuestionUseCase', () => {
  it('an edit adds a version and moves the pin', async () => {
    const { useCase, pkg, questionId, questions } = await setup()

    const result = await useCase.execute(TEACHER, pkg.id, questionId, {
      bodyHtml: '<p>Bumi datar</p>',
    })

    expect(result.items[0].questionVersion).toBe(2)
    expect(questions.questions.get(questionId)?.currentVersion).toBe(2)
    expect(questions.questions.get(questionId)?.current.bodyHtml).toContain(
      'Bumi datar',
    )
  })

  it('editing an approved package returns it to draft', async () => {
    const { useCase, pkg, questionId, setStatus } = await setup()
    setStatus('APPROVED')

    const result = await useCase.execute(TEACHER, pkg.id, questionId, {
      points: 2,
    })

    expect(result.status).toBe('DRAFT')
  })

  it('refuses a question that is not in the package', async () => {
    const { useCase, pkg } = await setup()

    await expect(
      useCase.execute(TEACHER, pkg.id, '00000000-0000-4000-8000-000000000000', {
        points: 2,
      }),
    ).rejects.toThrow(NotFoundException)
  })

  it('refuses an edit that changes nothing', async () => {
    const { useCase, pkg, questionId } = await setup()

    await expect(
      useCase.execute(TEACHER, pkg.id, questionId, {}),
    ).rejects.toThrow(BadRequestException)
  })

  it('refuses a submitted package', async () => {
    const { useCase, pkg, questionId, setStatus } = await setup()
    setStatus('SUBMITTED')

    await expect(
      useCase.execute(TEACHER, pkg.id, questionId, { points: 2 }),
    ).rejects.toThrow(ConflictException)
  })
})
