import { ForbiddenException, NotFoundException } from '@nestjs/common'
import {
  FakeQuestionRepository,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../question.repository.fake.js'
import { GetQuestionVersionsUseCase } from './get-question-versions.use-case.js'

const created = {
  ...MATH_7,
  authorEmployeeId: 'emp-1',
  type: 'TRUE_FALSE' as const,
  createdById: 'user-1',
  bodyHtml: '<p>Bumi bulat</p>',
  content: { answer: { value: true } },
  points: 1,
}

describe('GetQuestionVersionsUseCase', () => {
  it('lists every version, oldest first', async () => {
    const repository = new FakeQuestionRepository()
    const { scope } = buildTeacherScope({
      employeeId: 'emp-1',
      pairs: [MATH_7],
    })
    const question = await repository.create(created)
    repository.approve(question.id)
    await repository.addVersion(
      question.id,
      { bodyHtml: '<p>Baru</p>', content: created.content, points: 2 },
      'user-1',
    )

    const versions = await new GetQuestionVersionsUseCase(
      repository,
      scope,
    ).execute(TEACHER, question.id)

    expect(versions.map((v) => v.number)).toEqual([1, 2])
  })

  it('refuses outside the teacher scope and answers 404 for unknown', async () => {
    const repository = new FakeQuestionRepository()
    const { scope } = buildTeacherScope({ employeeId: 'emp-1', pairs: [] })
    const question = await repository.create(created)
    const useCase = new GetQuestionVersionsUseCase(repository, scope)

    await expect(useCase.execute(TEACHER, question.id)).rejects.toThrow(
      ForbiddenException,
    )
    await expect(useCase.execute(TEACHER, 'missing')).rejects.toThrow(
      NotFoundException,
    )
  })
})
