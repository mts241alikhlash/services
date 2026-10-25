import {
  MANAGER,
  TEACHER,
  buildTeacherScope,
} from '../../question.repository.fake.js'
import { GetQuestionScopeUseCase } from './get-question-scope.use-case.js'

const pairs = [
  { subjectId: 'math', subjectName: 'Matematika', gradeId: 'grade-7' },
  { subjectId: 'math', subjectName: 'Matematika', gradeId: 'grade-9' },
]

describe('GetQuestionScopeUseCase', () => {
  it('lists the subject and grade pairs of a teacher with their labels', async () => {
    const { scope, academic, employees } = buildTeacherScope({
      employeeId: 'emp-1',
      pairs,
      grades: [{ id: 'grade-7', level: 7, name: 'Kelas VII' }],
    })

    const result = await new GetQuestionScopeUseCase(
      scope,
      academic,
      employees,
    ).execute(TEACHER)

    expect(result).toEqual({
      all: false,
      employeeId: 'emp-1',
      pairs: [
        {
          subjectId: 'math',
          subjectName: 'Matematika',
          gradeId: 'grade-7',
          gradeLevel: 7,
          gradeName: 'Kelas VII',
        },
        {
          subjectId: 'math',
          subjectName: 'Matematika',
          gradeId: 'grade-9',
          gradeLevel: null,
          gradeName: null,
        },
      ],
    })
  })

  it('says all, with no pairs, for a user who manages every question', async () => {
    const { scope, academic, employees } = buildTeacherScope({
      employeeId: null,
    })

    await expect(
      new GetQuestionScopeUseCase(scope, academic, employees).execute(MANAGER),
    ).resolves.toEqual({ all: true, employeeId: null, pairs: [] })
  })

  it('returns no pairs for a user with no teaching assignment', async () => {
    const { scope, academic, employees } = buildTeacherScope({
      employeeId: 'emp-1',
    })

    await expect(
      new GetQuestionScopeUseCase(scope, academic, employees).execute(TEACHER),
    ).resolves.toEqual({ all: false, employeeId: 'emp-1', pairs: [] })
  })
})
