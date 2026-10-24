import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import {
  FakeQuestionRepository,
  MANAGER,
  MATH_7,
} from '../../question.repository.fake.js'
import { ReturnQuestionUseCase } from './return-question.use-case.js'

const created = {
  ...MATH_7,
  authorEmployeeId: 'emp-1',
  type: 'TRUE_FALSE' as const,
  createdById: 'user-1',
  bodyHtml: '<p>Bumi bulat</p>',
  content: { answer: { value: true } },
  points: 1,
}

async function submitted() {
  const repository = new FakeQuestionRepository()
  const question = await repository.create(created)
  repository.questions.set(question.id, { ...question, status: 'SUBMITTED' })
  return {
    repository,
    question,
    useCase: new ReturnQuestionUseCase(repository),
  }
}

describe('ReturnQuestionUseCase', () => {
  it('returns a submitted question with the note', async () => {
    const { question, useCase } = await submitted()

    const returned = await useCase.execute(
      MANAGER,
      question.id,
      '  Kunci jawaban keliru  ',
    )

    expect(returned.status).toBe('RETURNED')
    expect(returned.reviews).toMatchObject([
      {
        action: 'RETURNED',
        note: 'Kunci jawaban keliru',
        versionNumber: 1,
        byUserId: MANAGER.id,
      },
    ])
  })

  it('refuses a blank note or one over 1000 characters with 400', async () => {
    const { question, useCase } = await submitted()

    await expect(useCase.execute(MANAGER, question.id, '   ')).rejects.toThrow(
      new BadRequestException('Catatan pengembalian wajib diisi'),
    )
    await expect(
      useCase.execute(MANAGER, question.id, 'x'.repeat(1001)),
    ).rejects.toThrow(BadRequestException)
  })

  it('refuses a question that is not submitted, and unknown ones', async () => {
    const { repository, question, useCase } = await submitted()
    repository.questions.set(question.id, { ...question, status: 'DRAFT' })

    await expect(useCase.execute(MANAGER, question.id, 'x')).rejects.toThrow(
      ConflictException,
    )
    await expect(useCase.execute(MANAGER, 'missing', 'x')).rejects.toThrow(
      NotFoundException,
    )
  })
})
