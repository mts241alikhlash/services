import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import {
  FakeQuestionRepository,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../question.repository.fake.js'
import { SubmitQuestionUseCase } from './submit-question.use-case.js'

const created = {
  ...MATH_7,
  authorEmployeeId: 'emp-1',
  type: 'TRUE_FALSE' as const,
  createdById: TEACHER.id,
  bodyHtml: '<p>Bumi bulat</p>',
  content: { answer: { value: true } },
  points: 1,
}

async function build(employeeId = 'emp-1') {
  const repository = new FakeQuestionRepository()
  const { scope } = buildTeacherScope({ employeeId, pairs: [MATH_7] })
  const question = await repository.create(created)
  return {
    repository,
    question,
    useCase: new SubmitQuestionUseCase(repository, scope),
  }
}

describe('SubmitQuestionUseCase', () => {
  it('submits a draft and records the review', async () => {
    const { question, useCase } = await build()

    const submitted = await useCase.execute(TEACHER, question.id)

    expect(submitted.status).toBe('SUBMITTED')
    expect(submitted.reviews).toMatchObject([
      { action: 'SUBMITTED', versionNumber: 1, byUserId: TEACHER.id },
    ])
  })

  it('submits a returned question again', async () => {
    const { repository, question, useCase } = await build()
    repository.questions.set(question.id, { ...question, status: 'RETURNED' })

    await expect(useCase.execute(TEACHER, question.id)).resolves.toMatchObject({
      status: 'SUBMITTED',
    })
  })

  it.each(['SUBMITTED', 'APPROVED'] as const)(
    'refuses a %s question with 409',
    async (status) => {
      const { repository, question, useCase } = await build()
      repository.questions.set(question.id, { ...question, status })

      await expect(useCase.execute(TEACHER, question.id)).rejects.toThrow(
        ConflictException,
      )
    },
  )

  it('refuses a colleague and answers 404 for unknown', async () => {
    const { question, useCase } = await build('emp-2')

    await expect(useCase.execute(TEACHER, question.id)).rejects.toThrow(
      ForbiddenException,
    )
    await expect(useCase.execute(TEACHER, 'missing')).rejects.toThrow(
      NotFoundException,
    )
  })
})
