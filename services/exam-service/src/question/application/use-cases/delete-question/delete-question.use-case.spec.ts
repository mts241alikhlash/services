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
import { DeleteQuestionUseCase } from './delete-question.use-case.js'

const created = {
  packageId: 'package-1',
  ...MATH_7,
  authorEmployeeId: 'emp-1',
  type: 'TRUE_FALSE' as const,
  createdById: 'user-1',
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
    useCase: new DeleteQuestionUseCase(repository, scope),
  }
}

describe('DeleteQuestionUseCase', () => {
  it('removes a question that was never approved', async () => {
    const { repository, question, useCase } = await build()

    await useCase.execute(TEACHER, question.id)

    expect(await repository.findById(question.id)).toBeNull()
  })

  it('refuses a question that was approved once, even if it is a draft again', async () => {
    const { repository, question, useCase } = await build()
    repository.approve(question.id)
    await repository.addVersion(
      question.id,
      { bodyHtml: '<p>Baru</p>', content: created.content, points: 1 },
      'user-1',
    )

    await expect(useCase.execute(TEACHER, question.id)).rejects.toThrow(
      new ConflictException('Soal yang pernah disetujui tidak bisa dihapus'),
    )
    expect(await repository.findById(question.id)).not.toBeNull()
  })

  it("refuses a colleague's question and answers 404 for unknown", async () => {
    const { question, useCase } = await build('emp-2')

    await expect(useCase.execute(TEACHER, question.id)).rejects.toThrow(
      ForbiddenException,
    )
    await expect(useCase.execute(TEACHER, 'missing')).rejects.toThrow(
      NotFoundException,
    )
  })

  it('never deletes a question that was approved after the read', async () => {
    const { repository, question, useCase } = await build()
    const stale = await repository.findById(question.id)
    repository.approve(question.id)
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(stale)

    await expect(useCase.execute(TEACHER, question.id)).rejects.toThrow(
      ConflictException,
    )
    expect(await repository.findById(question.id)).not.toBeNull()
  })
})
