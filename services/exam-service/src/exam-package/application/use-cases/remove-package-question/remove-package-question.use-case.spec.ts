import { NotFoundException } from '@nestjs/common'
import { TEACHER } from '../../../../question/application/question.repository.fake.js'
import {
  TRUE_FALSE_INPUT,
  packageWorld,
} from '../../package-question.test-support.js'
import { AddPackageQuestionUseCase } from '../add-package-question/add-package-question.use-case.js'
import { RemovePackageQuestionUseCase } from './remove-package-question.use-case.js'

async function setup() {
  const world = await packageWorld()
  const add = new AddPackageQuestionUseCase(
    world.packages,
    world.questions,
    world.scope,
    world.employees,
  )
  await add.execute(TEACHER, world.pkg.id, TRUE_FALSE_INPUT)
  await add.execute(TEACHER, world.pkg.id, TRUE_FALSE_INPUT)
  const detail = await add.execute(TEACHER, world.pkg.id, TRUE_FALSE_INPUT)
  const useCase = new RemovePackageQuestionUseCase(world.packages, world.scope)
  return { ...world, useCase, ids: detail.items.map((item) => item.questionId) }
}

describe('RemovePackageQuestionUseCase', () => {
  it('deletes the question and closes the gap in positions', async () => {
    const { useCase, pkg, ids, questions } = await setup()

    const result = await useCase.execute(TEACHER, pkg.id, ids[1])

    expect(
      result.items.map((item) => [item.questionId, item.position]),
    ).toEqual([
      [ids[0], 1],
      [ids[2], 2],
    ])
    expect(questions.questions.get(ids[1])?.deletedAt).not.toBeNull()
  })

  it('refuses a question that is not in the package', async () => {
    const { useCase, pkg } = await setup()

    await expect(
      useCase.execute(TEACHER, pkg.id, '00000000-0000-4000-8000-000000000000'),
    ).rejects.toThrow(NotFoundException)
  })
})
