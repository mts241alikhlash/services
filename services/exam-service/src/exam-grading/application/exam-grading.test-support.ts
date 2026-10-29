import { FakeExamPackageRepository } from '../../exam-package/application/exam-package.repository.fake.js'
import { SUBJECT_ID } from '../../exam-package/application/exam-package.test-support.js'
import { FakeExamScheduleRepository } from '../../exam-schedule/application/exam-schedule.repository.fake.js'
import {
  CLASSROOM_7A,
  FakeAcademicLookup,
  SEMESTER_ID,
} from '../../exam-schedule/application/exam-schedule.test-support.js'
import type { ExamSchedule } from '../../exam-schedule/domain/entities/exam-schedule.entity.js'
import { FakeExamSessionRepository } from '../../exam-session/application/exam-session.repository.fake.js'
import {
  CHOICES,
  FakeStudentDirectory,
  STUDENT_ID,
  choiceSpec,
  schedulePaper,
  sessionFor,
  type PaperQuestionSpec,
} from '../../exam-session/application/exam-session.test-support.js'
import type { AnswerPayload } from '../../exam-session/domain/policies/validate-answer-shape.policy.js'
import { FakeQuestionRepository } from '../../question/application/question.repository.fake.js'
import type { IEmployeeIdentityReadPort } from '../../platform/employee-identity/employee-identity.port.js'
import {
  GradingScopeService,
  type GradingUser,
} from './grading-scope.service.js'

export const TEACHER: GradingUser = {
  id: 'teacher-user',
  roles: ['TEACHER'],
  permissions: ['exam-grading.read', 'exam-grading.grade'],
}
export const STAFF: GradingUser = {
  id: 'staff-user',
  roles: ['CURRICULUM_STAFF'],
  permissions: [
    'exam-grading.read',
    'exam-grading.grade',
    'exam-grading.manage-all',
  ],
}

export const essaySpec: PaperQuestionSpec = {
  type: 'ESSAY',
  content: { guideHtml: '<p>Pedoman</p>' },
  points: 10,
}
export const shortSpec: PaperQuestionSpec = {
  type: 'SHORT_ANSWER',
  content: {
    answer: { accepted: ['jakarta'], ignoreCase: true, ignoreHarakat: true },
  },
  points: 4,
}

export function build(
  options: {
    taught?: { subjectId: string; classroomId: string }[]
    employee?: string | null
  } = {},
) {
  const packages = new FakeExamPackageRepository()
  const schedules = new FakeExamScheduleRepository(packages)
  const questions = new FakeQuestionRepository()
  const sessions = new FakeExamSessionRepository()
  const academic = new FakeAcademicLookup({
    assignments: options.taught ?? [
      { subjectId: SUBJECT_ID, classroomId: CLASSROOM_7A.id },
    ],
  })
  const employees = {
    findEmployeeIdByUserId: () =>
      Promise.resolve(
        options.employee === undefined ? 'emp-1' : options.employee,
      ),
    employeeExists: () => Promise.resolve(true),
  } as IEmployeeIdentityReadPort
  schedules.withSessions = (id) =>
    [...sessions.sessions.values()].some((session) => session.scheduleId === id)
  const scope = new GradingScopeService(employees, academic)
  const students = new FakeStudentDirectory()
  return { packages, schedules, questions, sessions, academic, scope, students }
}

export type World = ReturnType<typeof build>

export async function paperWithManual(
  world: World,
  specs: PaperQuestionSpec[] = [choiceSpec('B'), essaySpec, shortSpec],
): Promise<{ schedule: ExamSchedule; questionIds: string[] }> {
  return schedulePaper(world, specs)
}

export function submitted(
  world: World,
  schedule: ExamSchedule,
  answers: Record<string, AnswerPayload>,
  overrides: Partial<ReturnType<typeof sessionFor>> = {},
) {
  const session = sessionFor(schedule, {
    id: 'ses-1',
    studentId: STUDENT_ID,
    status: 'SUBMITTED',
    submittedAt: new Date('2026-11-02T03:00:00.000Z'),
    ...overrides,
  })
  world.sessions.sessions.set(session.id, session)
  for (const [questionId, answer] of Object.entries(answers)) {
    world.sessions.answers.set(`a-${session.id}-${questionId}`, {
      id: `a-${session.id}-${questionId}`,
      sessionId: session.id,
      questionId,
      answer,
      clientId: `c-${questionId}`,
      receivedAfterDeadline: false,
      score: null,
      gradedById: null,
      gradedAt: null,
      gradeNote: null,
      createdAt: session.startedAt,
      updatedAt: session.startedAt,
    })
  }
  return session
}

export { CHOICES, SEMESTER_ID, SUBJECT_ID, CLASSROOM_7A }
