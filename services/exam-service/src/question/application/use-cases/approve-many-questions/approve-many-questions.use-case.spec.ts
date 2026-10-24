import {
  FakeQuestionRepository,
  MANAGER,
  MATH_7,
} from '../../question.repository.fake.js'
import { ApproveQuestionUseCase } from '../approve-question/approve-question.use-case.js'
import { ApproveManyQuestionsUseCase } from './approve-many-questions.use-case.js'

const created = {
  ...MATH_7,
  authorEmployeeId: 'emp-1',
  type: 'TRUE_FALSE' as const,
  createdById: 'user-1',
  bodyHtml: '<p>Bumi bulat</p>',
  content: { answer: { value: true } },
  points: 1,
}

describe('ApproveManyQuestionsUseCase', () => {
  it('approves what it can and reports a reason for each skipped id', async () => {
    const repository = new FakeQuestionRepository()
    const ready = await repository.create(created)
    const draft = await repository.create(created)
    repository.questions.set(ready.id, { ...ready, status: 'SUBMITTED' })
    const useCase = new ApproveManyQuestionsUseCase(
      new ApproveQuestionUseCase(repository),
    )

    const results = await useCase.execute(MANAGER, [
      ready.id,
      draft.id,
      'missing',
      ready.id,
    ])

    expect(results).toEqual([
      { id: ready.id, ok: true },
      {
        id: draft.id,
        ok: false,
        reason: 'Hanya soal yang diajukan yang bisa disetujui',
      },
      { id: 'missing', ok: false, reason: 'Soal tidak ditemukan' },
    ])
    expect((await repository.findById(ready.id))?.status).toBe('APPROVED')
  })
})
