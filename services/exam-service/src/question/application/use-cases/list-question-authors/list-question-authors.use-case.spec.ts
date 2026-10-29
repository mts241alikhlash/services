import {
  FakeQuestionRepository,
  MANAGER,
  MATH_7,
  TEACHER,
  buildTeacherScope,
} from '../../question.repository.fake.js'
import type { IAuthorLookupPort } from '../../../../platform/author-lookup/author-lookup.port.js'
import { ListQuestionAuthorsUseCase } from './list-question-authors.use-case.js'

const base = {
  packageId: 'package-1',
  type: 'TRUE_FALSE' as const,
  createdById: 'user-1',
  bodyHtml: '<p>Soal</p>',
  content: { answer: { value: true } },
  points: 1,
}

async function build(employeeId: string | null) {
  const repository = new FakeQuestionRepository()
  await repository.create({ ...base, ...MATH_7, authorEmployeeId: 'emp-b' })
  await repository.create({ ...base, ...MATH_7, authorEmployeeId: 'emp-a' })
  await repository.create({ ...base, ...MATH_7, authorEmployeeId: 'emp-a' })
  await repository.create({
    ...base,
    subjectId: 'ipa',
    gradeId: 'grade-7',
    authorEmployeeId: 'emp-c',
  })
  const { scope } = buildTeacherScope({ employeeId, pairs: [MATH_7] })
  const authors = {
    namesOf: () =>
      Promise.resolve(
        new Map([
          ['emp-a', 'Ustadz Ahmad'],
          ['emp-b', 'Ustadzah Baiq'],
        ]),
      ),
  } as IAuthorLookupPort
  return new ListQuestionAuthorsUseCase(repository, scope, authors)
}

describe('ListQuestionAuthorsUseCase', () => {
  it('lists each author once, by name, among the questions the user may see', async () => {
    const useCase = await build('emp-a')

    await expect(useCase.execute(TEACHER, {})).resolves.toEqual([
      { id: 'emp-a', name: 'Ustadz Ahmad' },
      { id: 'emp-b', name: 'Ustadzah Baiq' },
    ])
  })

  it('lists every author to a manager, naming the unknown ones by a dash', async () => {
    const useCase = await build(null)

    await expect(useCase.execute(MANAGER, {})).resolves.toEqual([
      { id: 'emp-a', name: 'Ustadz Ahmad' },
      { id: 'emp-b', name: 'Ustadzah Baiq' },
      { id: 'emp-c', name: '-' },
    ])
  })

  it('narrows to a status', async () => {
    const useCase = await build(null)

    await expect(
      useCase.execute(MANAGER, { status: 'SUBMITTED' }),
    ).resolves.toEqual([])
  })
})
