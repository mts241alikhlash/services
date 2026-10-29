import { CreateExamPackageUseCase } from '../../exam-package/application/use-cases/create-exam-package/create-exam-package.use-case.js'
import type { FakeExamPackageRepository } from '../../exam-package/application/exam-package.repository.fake.js'
import {
  GRADE_ID,
  SUBJECT_ID,
  USER,
  seedApprovedQuestion,
} from '../../exam-package/application/exam-package.test-support.js'
import type { FakeQuestionRepository } from '../../question/application/question.repository.fake.js'
import {
  IAcademicLookupPort,
  type ClassroomRef,
  type SubjectRef,
} from '../../platform/academic-lookup/academic-lookup.port.js'

export const YEAR_ID = '12121212-1212-4212-8212-121212121212'

export const CLASSROOM_7A: ClassroomRef = {
  id: '77777777-7777-4777-8777-777777777777',
  gradeId: '22222222-2222-4222-8222-222222222222',
  academicYearId: YEAR_ID,
  name: 'VII A',
}

export const SEMESTER_ID = '88888888-8888-4888-8888-888888888888'

export class FakeAcademicLookup extends IAcademicLookupPort {
  constructor(
    private readonly options: {
      classrooms?: ClassroomRef[]
      subjects?: SubjectRef[]
      semesterId?: string | null
      failWith?: Error
      assignments?: { subjectId: string; classroomId: string }[]
      assignmentsBySemester?: Record<
        string,
        { subjectId: string; classroomId: string }[]
      >
    } = {},
  ) {
    super()
  }

  teachingAssignmentsOf(_employeeId: string, semesterId: string) {
    if (this.options.failWith) return Promise.reject(this.options.failWith)
    return Promise.resolve(
      this.options.assignmentsBySemester?.[semesterId] ??
        this.options.assignments ??
        [],
    )
  }

  classroomsByIds(ids: string[]) {
    if (this.options.failWith) return Promise.reject(this.options.failWith)
    return Promise.resolve(
      (this.options.classrooms ?? [CLASSROOM_7A]).filter((room) =>
        ids.includes(room.id),
      ),
    )
  }

  activeSemester() {
    if (this.options.failWith) return Promise.reject(this.options.failWith)
    const id =
      this.options.semesterId === undefined
        ? SEMESTER_ID
        : this.options.semesterId
    return Promise.resolve(id === null ? null : { id, academicYearId: YEAR_ID })
  }

  teachingPairsOf() {
    return Promise.resolve([])
  }

  gradesByIds() {
    return Promise.resolve([])
  }

  subjectsByIds(ids: string[]) {
    if (this.options.failWith) return Promise.reject(this.options.failWith)
    return Promise.resolve(
      (this.options.subjects ?? []).filter((subject) =>
        ids.includes(subject.id),
      ),
    )
  }
}

export const START = new Date('2026-11-02T01:00:00.000Z')
export const END = new Date('2026-11-02T04:00:00.000Z')

export async function approvedPackage(
  packages: FakeExamPackageRepository,
  questions: FakeQuestionRepository,
) {
  const question = await seedApprovedQuestion(questions)
  const created = await new CreateExamPackageUseCase(
    packages,
    questions,
  ).execute(USER, {
    title: 'UTS Matematika Kelas 7',
    subjectId: SUBJECT_ID,
    gradeId: GRADE_ID,
    questionIds: [question.id],
  })
  const approved = { ...created, status: 'APPROVED' as const }
  packages.packages.set(created.id, approved)
  return approved
}

export { USER }
