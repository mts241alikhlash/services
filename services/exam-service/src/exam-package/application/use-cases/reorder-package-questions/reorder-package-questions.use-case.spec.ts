import { BadRequestException } from '@nestjs/common'
import { TEACHER } from '../../../../question/application/question.repository.fake.js'
import {
  TRUE_FALSE_INPUT,
  packageWorld,
} from '../../package-question.test-support.js'
import { AddPackageQuestionUseCase } from '../add-package-question/add-package-question.use-case.js'
import { ReorderPackageQuestionsUseCase } from './reorder-package-questions.use-case.js'

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
  const useCase = new ReorderPackageQuestionsUseCase(
    world.packages,
    world.scope,
  )
  return { ...world, useCase, ids: detail.items.map((item) => item.questionId) }
}

describe('ReorderPackageQuestionsUseCase', () => {
  it('puts the items in the order given', async () => {
    const { useCase, pkg, ids } = await setup()

    const result = await useCase.execute(TEACHER, pkg.id, [
      ids[2],
      ids[0],
      ids[1],
    ])

    expect(
      result.items.map((item) => [item.questionId, item.position]),
    ).toEqual([
      [ids[2], 1],
      [ids[0], 2],
      [ids[1], 3],
    ])
  })

  it('refuses a missing, extra or repeated id', async () => {
    const { useCase, pkg, ids } = await setup()
    const stranger = '00000000-0000-4000-8000-000000000000'

    for (const bad of [
      [ids[0], ids[1]],
      [ids[0], ids[1], ids[2], stranger],
      [ids[0], ids[0], ids[1]],
    ]) {
      await expect(useCase.execute(TEACHER, pkg.id, bad)).rejects.toThrow(
        BadRequestException,
      )
    }
  })
})
