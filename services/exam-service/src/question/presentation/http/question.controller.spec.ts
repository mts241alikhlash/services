import {
  FakeQuestionRepository,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../application/question.repository.fake.js'
import { CreateQuestionUseCase } from '../../application/use-cases/create-question/create-question.use-case.js'
import { DeleteQuestionUseCase } from '../../application/use-cases/delete-question/delete-question.use-case.js'
import { GetQuestionUseCase } from '../../application/use-cases/get-question/get-question.use-case.js'
import { GetQuestionVersionsUseCase } from '../../application/use-cases/get-question-versions/get-question-versions.use-case.js'
import { ListQuestionsUseCase } from '../../application/use-cases/list-questions/list-questions.use-case.js'
import { UpdateQuestionUseCase } from '../../application/use-cases/update-question/update-question.use-case.js'
import { QuestionController } from './question.controller.js'
import type { CreateQuestionDto } from './dto/request/create-question.dto.js'

function build() {
  const repository = new FakeQuestionRepository()
  const { scope, employees } = buildTeacherScope({
    employeeId: 'emp-1',
    pairs: [MATH_7],
  })
  return new QuestionController(
    new ListQuestionsUseCase(repository, scope),
    new GetQuestionUseCase(repository, scope),
    new GetQuestionVersionsUseCase(repository, scope),
    new CreateQuestionUseCase(repository, scope, employees),
    new UpdateQuestionUseCase(repository, scope),
    new DeleteQuestionUseCase(repository, scope),
  )
}

const dto: CreateQuestionDto = {
  ...MATH_7,
  type: 'TRUE_FALSE',
  bodyHtml: '<p>Bumi bulat</p>',
  content: { answer: { value: true } },
  points: 1,
}

describe('QuestionController', () => {
  it('answers with response DTOs whose dates are ISO strings', async () => {
    const controller = build()

    const created = await controller.create(TEACHER, dto)
    const found = await controller.findOne(TEACHER, created.id)
    const list = await controller.findAll(TEACHER, {})
    const versions = await controller.versions(TEACHER, created.id)

    expect(created.createdAt).toBe(found.createdAt)
    expect(typeof created.createdAt).toBe('string')
    expect(found.current.number).toBe(1)
    expect(found.approved).toBeNull()
    expect(list).toMatchObject({ total: 1, page: 1, limit: 10 })
    expect(list.data[0]).toMatchObject({
      id: created.id,
      bodyHtml: '<p>Bumi bulat</p>',
    })
    expect('deletedAt' in list.data[0]).toBe(false)
    expect(versions.map((v) => v.number)).toEqual([1])
  })

  it('updates and deletes through the use cases', async () => {
    const controller = build()
    const created = await controller.create(TEACHER, dto)

    const updated = await controller.update(TEACHER, created.id, { points: 4 })
    await controller.remove(TEACHER, created.id)

    expect(updated.current.points).toBe(4)
    await expect(controller.findOne(TEACHER, created.id)).rejects.toThrow()
  })
})
