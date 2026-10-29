import { ForbiddenException, NotFoundException } from '@nestjs/common'
import {
  FakeQuestionRepository,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../question.repository.fake.js'
import { GetQuestionUseCase } from './get-question.use-case.js'

const created = {
  packageId: 'package-1',
  ...MATH_7,
  authorEmployeeId: 'emp-1',
  type: 'ESSAY' as const,
  createdById: 'user-1',
  bodyHtml: '<p>Jelaskan</p>',
  content: { guideHtml: null },
  points: 4,
}

describe('GetQuestionUseCase', () => {
  it('returns a question inside the teacher scope', async () => {
    const repository = new FakeQuestionRepository()
    const { scope } = buildTeacherScope({
      employeeId: 'emp-1',
      pairs: [MATH_7],
    })
    const question = await repository.create(created)

    const found = await new GetQuestionUseCase(repository, scope).execute(
      TEACHER,
      question.id,
    )

    expect(found.id).toBe(question.id)
  })

  it('refuses a question outside the teacher scope', async () => {
    const repository = new FakeQuestionRepository()
    const { scope } = buildTeacherScope({ employeeId: 'emp-1', pairs: [] })
    const question = await repository.create(created)

    await expect(
      new GetQuestionUseCase(repository, scope).execute(TEACHER, question.id),
    ).rejects.toThrow(ForbiddenException)
  })

  it('answers 404 for an unknown or deleted question', async () => {
    const repository = new FakeQuestionRepository()
    const { scope } = buildTeacherScope({
      employeeId: 'emp-1',
      pairs: [MATH_7],
    })
    const question = await repository.create(created)
    await repository.softDeleteNeverApproved(question.id)
    const useCase = new GetQuestionUseCase(repository, scope)

    await expect(useCase.execute(TEACHER, 'missing')).rejects.toThrow(
      NotFoundException,
    )
    await expect(useCase.execute(TEACHER, question.id)).rejects.toThrow(
      NotFoundException,
    )
  })
})
