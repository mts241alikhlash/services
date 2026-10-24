import {
  FakeQuestionRepository,
  MANAGER,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../question.repository.fake.js'
import type { IAuthorLookupPort } from '../../../../platform/author-lookup/author-lookup.port.js'
import { ListQuestionsUseCase } from './list-questions.use-case.js'

const base = {
  authorEmployeeId: 'emp-1',
  type: 'TRUE_FALSE' as const,
  createdById: 'user-1',
  bodyHtml: '<p>Soal</p>',
  content: { answer: { value: true } },
  points: 1,
}

async function build(employeeId: string | null = 'emp-1') {
  const repository = new FakeQuestionRepository()
  await repository.create({ ...base, ...MATH_7 })
  await repository.create({ ...base, ...MATH_7 })
  await repository.create({ ...base, subjectId: 'math', gradeId: 'grade-8' })
  await repository.create({ ...base, subjectId: 'ipa', gradeId: 'grade-7' })
  const { scope } = buildTeacherScope({ employeeId, pairs: [MATH_7] })
  const authors = {
    namesOf: () => Promise.resolve(new Map([['emp-1', 'Ustadz Ahmad']])),
  } as IAuthorLookupPort
  return { useCase: new ListQuestionsUseCase(repository, scope, authors) }
}

describe('ListQuestionsUseCase', () => {
  it('returns only the teacher pairs and counts only those', async () => {
    const { useCase } = await build()

    const result = await useCase.execute(TEACHER, {})

    expect(result.total).toBe(2)
    expect(result.data.map((q) => [q.subjectId, q.gradeId])).toEqual([
      ['math', 'grade-7'],
      ['math', 'grade-7'],
    ])
  })

  it('returns nothing when the query names a pair the teacher does not teach', async () => {
    const { useCase } = await build()

    const result = await useCase.execute(TEACHER, {
      subjectId: 'ipa',
      gradeId: 'grade-7',
    })

    expect(result).toMatchObject({ data: [], total: 0 })
  })

  it('returns every question to a manager', async () => {
    const { useCase } = await build(null)

    const result = await useCase.execute(MANAGER, {})

    expect(result.total).toBe(4)
  })

  it('pages with defaults of page 1 and 10 rows', async () => {
    const { useCase } = await build()

    const result = await useCase.execute(TEACHER, { page: 2, limit: 1 })

    expect(result).toMatchObject({ page: 2, limit: 1, total: 2 })
    expect(result.data).toHaveLength(1)
    expect(await useCase.execute(TEACHER, {})).toMatchObject({
      page: 1,
      limit: 10,
    })
  })

  it('names the author of each question, and leaves the name empty when unknown', async () => {
    const { useCase } = await build()

    const result = await useCase.execute(TEACHER, {})

    expect(result.data.map((q) => q.authorName)).toEqual([
      'Ustadz Ahmad',
      'Ustadz Ahmad',
    ])
  })
})
