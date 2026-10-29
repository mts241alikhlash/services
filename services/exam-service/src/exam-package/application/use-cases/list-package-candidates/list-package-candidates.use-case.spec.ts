import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import {
  GRADE_ID,
  SUBJECT_ID,
  USER,
  seedApprovedQuestion,
} from '../../exam-package.test-support.js'
import { ListPackageCandidatesUseCase } from './list-package-candidates.use-case.js'

describe('ListPackageCandidatesUseCase', () => {
  let questions: FakeQuestionRepository
  let useCase: ListPackageCandidatesUseCase

  beforeEach(() => {
    questions = new FakeQuestionRepository()
    useCase = new ListPackageCandidatesUseCase(questions)
  })

  const query = { subjectId: SUBJECT_ID, gradeId: GRADE_ID }

  it('returns approved questions of the subject and grade without any teaching scope', async () => {
    const approved = await seedApprovedQuestion(questions, {
      bodyHtml: '<p>Hasil <b>12 x 8</b></p>',
    })

    const page = await useCase.execute(query)

    expect(page.total).toBe(1)
    expect(page.data).toEqual([
      {
        id: approved.id,
        type: 'TRUE_FALSE',
        summary: 'Hasil 12 x 8',
        points: 2,
        approvedVersion: 1,
      },
    ])
  })

  it('leaves out drafts, submitted and returned questions', async () => {
    const approved = await seedApprovedQuestion(questions)
    for (const status of ['DRAFT', 'SUBMITTED', 'RETURNED'] as const) {
      const other = await seedApprovedQuestion(questions)
      questions.questions.set(other.id, { ...other, status })
    }

    const page = await useCase.execute(query)

    expect(page.data.map((row) => row.id)).toEqual([approved.id])
  })

  it('leaves out questions of another subject or grade', async () => {
    await seedApprovedQuestion(questions, {
      subjectId: '33333333-3333-4333-8333-333333333333',
    })
    await seedApprovedQuestion(questions, {
      gradeId: '44444444-4444-4444-8444-444444444444',
    })

    expect((await useCase.execute(query)).total).toBe(0)
  })

  it('searches the question text', async () => {
    await seedApprovedQuestion(questions, { bodyHtml: '<p>Ibu kota</p>' })
    const match = await seedApprovedQuestion(questions, {
      bodyHtml: '<p>Hasil perkalian</p>',
    })

    const page = await useCase.execute({ ...query, search: 'perkalian' })

    expect(page.data.map((row) => row.id)).toEqual([match.id])
  })

  it('paginates', async () => {
    for (let i = 0; i < 3; i++) await seedApprovedQuestion(questions)

    const page = await useCase.execute({ ...query, page: 2, limit: 2 })

    expect(page.total).toBe(3)
    expect(page.data).toHaveLength(1)
    expect(page.page).toBe(2)
    expect(page.limit).toBe(2)
  })

  it('does not need the author to be the caller', async () => {
    await seedApprovedQuestion(questions)

    expect((await useCase.execute(query)).total).toBe(1)
    expect(USER.id).toBeDefined()
  })
})
