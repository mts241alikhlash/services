import {
  FakeQuestionRepository,
  MATH_7,
  MANAGER,
  TEACHER,
  buildTeacherScope,
} from '../../application/question.repository.fake.js'
import { CreateQuestionUseCase } from '../../application/use-cases/create-question/create-question.use-case.js'
import { ApproveManyQuestionsUseCase } from '../../application/use-cases/approve-many-questions/approve-many-questions.use-case.js'
import { ApproveQuestionUseCase } from '../../application/use-cases/approve-question/approve-question.use-case.js'
import { ReturnQuestionUseCase } from '../../application/use-cases/return-question/return-question.use-case.js'
import { SubmitQuestionUseCase } from '../../application/use-cases/submit-question/submit-question.use-case.js'
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
  const approve = new ApproveQuestionUseCase(repository)
  return new QuestionController(
    new ListQuestionsUseCase(repository, scope),
    new GetQuestionUseCase(repository, scope),
    new GetQuestionVersionsUseCase(repository, scope),
    new CreateQuestionUseCase(repository, scope, employees),
    new UpdateQuestionUseCase(repository, scope),
    new DeleteQuestionUseCase(repository, scope),
    new SubmitQuestionUseCase(repository, scope),
    approve,
    new ReturnQuestionUseCase(repository),
    new ApproveManyQuestionsUseCase(approve),
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

  it('moves a question through submit, return and approve', async () => {
    const controller = build()
    const created = await controller.create(TEACHER, dto)

    const submitted = await controller.submit(TEACHER, created.id)
    const returned = await controller.returnToAuthor(MANAGER, created.id, {
      note: 'Perbaiki kunci',
      revision: submitted.revision,
    })
    const resubmitted = await controller.submit(TEACHER, created.id)
    const approved = await controller.approve(MANAGER, created.id, {
      revision: resubmitted.revision,
    })

    expect(submitted.status).toBe('SUBMITTED')
    expect(returned.reviews.at(-1)).toMatchObject({
      action: 'RETURNED',
      note: 'Perbaiki kunci',
    })
    expect(approved).toMatchObject({ status: 'APPROVED', approvedVersion: 1 })
    expect(approved.approved?.number).toBe(1)
  })

  it('approves many and reports each id', async () => {
    const controller = build()
    const created = await controller.create(TEACHER, dto)
    const submitted = await controller.submit(TEACHER, created.id)

    const result = await controller.approveManyQuestions(MANAGER, {
      items: [
        { id: created.id, revision: submitted.revision },
        { id: '3f0b6a0e-0000-4000-8000-000000000000', revision: 1 },
      ],
    })

    expect(result.data).toEqual([
      { id: created.id, ok: true },
      {
        id: '3f0b6a0e-0000-4000-8000-000000000000',
        ok: false,
        reason: 'Soal tidak ditemukan',
      },
    ])
  })
})
