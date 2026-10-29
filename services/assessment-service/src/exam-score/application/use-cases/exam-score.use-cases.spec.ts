import { FakeExamScoreRepository } from '../exam-score.repository.fake.js'
import { ListExamScoresUseCase } from './list-exam-scores/list-exam-scores.use-case.js'
import { UpsertExamScoreUseCase } from './upsert-exam-score/upsert-exam-score.use-case.js'

const input = {
  examSessionId: 'ses-1',
  enrollmentId: 'enr-1',
  studentId: 'stu-1',
  studentName: 'Ahmad Fauzi',
  studentNis: '2024001',
  subjectId: 'math',
  gradeId: 'g7',
  classroomId: '7a',
  semesterId: 'sem-1',
  examTitle: 'UTS Matematika',
  rawScore: 8,
  maxScore: 10,
  score: 80,
  gradedAt: new Date('2026-11-03T02:00:00.000Z'),
}

const reader = (permissions: string[]) => ({
  id: 'u1',
  roles: ['TEACHER'],
  permissions,
})

const teacherAssignments = (
  pairs: { subjectId: string; classroomId: string }[],
) => ({
  employees: {
    findEmployeeIdByUserId: () => Promise.resolve('emp-1'),
    employeeExists: () => Promise.resolve(true),
  },
  academic: {
    listTeachingAssignmentsByEmployee: jest.fn(() =>
      Promise.resolve(pairs.map((pair) => ({ ...pair, id: 'x' }))),
    ),
    findActiveSemester: () =>
      Promise.resolve({ id: 'sem-1', academicYearId: 'y', typeName: null }),
    listClassrooms: (ids: string[]) =>
      Promise.resolve(
        ids.map((id) => ({ id, code: id.toUpperCase(), name: `Kelas ${id}` })),
      ),
  },
})

describe('exam scores', () => {
  describe('upsert', () => {
    it('stores a score once per session and updates it on resend', async () => {
      const repo = new FakeExamScoreRepository()
      const useCase = new UpsertExamScoreUseCase(repo)

      const first = await useCase.execute(input)
      const second = await useCase.execute({ ...input, rawScore: 9, score: 90 })

      expect(repo.rows.size).toBe(1)
      expect(second.id).toBe(first.id)
      expect(second.score).toBe(90)
    })
  })

  describe('list', () => {
    const build = async (
      pairs: { subjectId: string; classroomId: string }[],
    ) => {
      const repo = new FakeExamScoreRepository()
      await new UpsertExamScoreUseCase(repo).execute(input)
      await new UpsertExamScoreUseCase(repo).execute({
        ...input,
        examSessionId: 'ses-2',
        classroomId: '7b',
      })
      await new UpsertExamScoreUseCase(repo).execute({
        ...input,
        examSessionId: 'ses-3',
        semesterId: 'sem-0',
      })
      const lookups = teacherAssignments(pairs)
      return {
        lookups,
        useCase: new ListExamScoresUseCase(
          repo,
          lookups.employees,
          lookups.academic as never,
        ),
      }
    }

    it('shows a teacher only the classes and subjects taught that semester', async () => {
      const { useCase, lookups } = await build([
        { subjectId: 'math', classroomId: '7a' },
      ])

      const page = await useCase.execute(reader(['exam-scores.read']), {
        page: 1,
        limit: 10,
      })

      expect(page.data.map((row) => row.examSessionId)).toEqual(['ses-1'])
      expect(
        lookups.academic.listTeachingAssignmentsByEmployee,
      ).toHaveBeenCalledWith('emp-1', 'sem-1')
    })

    it('uses the semester asked for', async () => {
      const { useCase, lookups } = await build([
        { subjectId: 'math', classroomId: '7a' },
      ])

      const page = await useCase.execute(reader(['exam-scores.read']), {
        page: 1,
        limit: 10,
        semesterId: 'sem-0',
      })

      expect(
        lookups.academic.listTeachingAssignmentsByEmployee,
      ).toHaveBeenCalledWith('emp-1', 'sem-0')
      expect(page.data.map((row) => row.examSessionId)).toEqual(['ses-3'])
    })

    it('shows read-all every row without asking about assignments', async () => {
      const { useCase, lookups } = await build([])

      const page = await useCase.execute(
        reader(['exam-scores.read', 'exam-scores.read-all']),
        { page: 1, limit: 10 },
      )

      expect(page.total).toBe(3)
      expect(
        lookups.academic.listTeachingAssignmentsByEmployee,
      ).not.toHaveBeenCalled()
    })

    it('shows a teacher with no assignments nothing', async () => {
      const { useCase } = await build([])

      expect(
        (
          await useCase.execute(reader(['exam-scores.read']), {
            page: 1,
            limit: 10,
          })
        ).total,
      ).toBe(0)
    })

    it('labels rows with the classroom name and survives a failing name lookup', async () => {
      const { useCase, lookups } = await build([
        { subjectId: 'math', classroomId: '7a' },
      ])
      const ok = await useCase.execute(reader(['exam-scores.read']), {
        page: 1,
        limit: 10,
      })
      expect(ok.data[0].classroomName).toBe('Kelas 7a')

      lookups.academic.listClassrooms = () => Promise.reject(new Error('down'))
      const degraded = await useCase.execute(reader(['exam-scores.read']), {
        page: 1,
        limit: 10,
      })
      expect(degraded.data[0].classroomName).toBeNull()
    })
  })
})
