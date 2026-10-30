import type { FakeExamPackageRepository } from '../../exam-package/application/exam-package.repository.fake.js'
import {
  SUBJECT_ID,
  USER,
  seedPackage,
} from '../../exam-package/application/exam-package.test-support.js'
import {
  GradingScopeService,
  type GradingUser,
} from '../../exam-grading/application/grading-scope.service.js'
import type { IEmployeeIdentityReadPort } from '../../platform/employee-identity/employee-identity.port.js'
import { MakeupScopeService } from './makeup-scope.service.js'
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

export function approvedPackage(
  packages: FakeExamPackageRepository,
  questions: FakeQuestionRepository,
) {
  return seedPackage(packages, questions)
}

export { USER }

export const TEACHER_USER: GradingUser = {
  id: 'teacher-user',
  roles: ['TEACHER'],
  permissions: ['exam-grading.read', 'exam-grading.grade'],
}

export const STAFF_USER: GradingUser = {
  id: 'staff-user',
  roles: ['CURRICULUM_STAFF'],
  permissions: [
    'exam-grading.read',
    'exam-grading.grade',
    'exam-grading.manage-all',
  ],
}

export function makeupScope(
  taught: { subjectId: string; classroomId: string }[] = [
    { subjectId: SUBJECT_ID, classroomId: CLASSROOM_7A.id },
  ],
): MakeupScopeService {
  const employees = {
    findEmployeeIdByUserId: () => Promise.resolve('emp-1'),
    employeeExists: () => Promise.resolve(true),
  } as IEmployeeIdentityReadPort
  return new MakeupScopeService(
    new GradingScopeService(
      employees,
      new FakeAcademicLookup({ assignments: taught }),
    ),
  )
}
