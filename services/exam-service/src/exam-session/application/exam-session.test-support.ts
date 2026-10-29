import { ServiceUnavailableException } from '@nestjs/common'
import type { FakeExamPackageRepository } from '../../exam-package/application/exam-package.repository.fake.js'
import { CreateExamScheduleUseCase } from '../../exam-schedule/application/use-cases/create-exam-schedule/create-exam-schedule.use-case.js'
import type { FakeExamScheduleRepository } from '../../exam-schedule/application/exam-schedule.repository.fake.js'
import {
  CLASSROOM_7A,
  FakeAcademicLookup,
  SEMESTER_ID,
  USER,
  draftPackage,
} from '../../exam-schedule/application/exam-schedule.test-support.js'
import type { ExamSchedule } from '../../exam-schedule/domain/entities/exam-schedule.entity.js'
import {
  IEnrollmentLookupPort,
  type ActiveEnrollment,
} from '../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { IStudentDirectoryPort } from '../../platform/student-directory/student-directory.port.js'
import { IStudentIdentityReadPort } from '../../platform/student-identity/student-identity.port.js'
import { CreateExamPackageUseCase } from '../../exam-package/application/use-cases/create-exam-package/create-exam-package.use-case.js'
import {
  GRADE_ID,
  SUBJECT_ID,
  seedApprovedQuestion,
} from '../../exam-package/application/exam-package.test-support.js'
import type { FakeQuestionRepository } from '../../question/application/question.repository.fake.js'
import type {
  ChoiceKey,
  QuestionContent,
  QuestionType,
} from '../../question/domain/value-objects/question-content.js'
import type { ExamSession } from '../domain/entities/exam-session.entity.js'

export const STUDENT_USER = {
  id: '10101010-1010-4010-8010-101010101010',
  deviceId: 'device-1',
}
export const STUDENT_ID = '20202020-2020-4020-8020-202020202020'
export const NOW = new Date('2026-11-02T02:00:00.000Z')
export const STARTS = new Date('2026-11-02T01:00:00.000Z')
export const ENDS = new Date('2026-11-02T04:00:00.000Z')

export class FakeStudentIdentity extends IStudentIdentityReadPort {
  constructor(
    private readonly options: {
      studentId?: string | null
      failWith?: Error
    } = {},
  ) {
    super()
  }

  findStudentIdByUserId() {
    if (this.options.failWith) return Promise.reject(this.options.failWith)
    return Promise.resolve(
      this.options.studentId === undefined
        ? STUDENT_ID
        : this.options.studentId,
    )
  }
}

export class FakeEnrollment extends IEnrollmentLookupPort {
  constructor(
    private readonly options: {
      enrollment?: ActiveEnrollment | null
      failWith?: Error
    } = {},
  ) {
    super()
  }

  findActiveByStudent() {
    if (this.options.failWith) return Promise.reject(this.options.failWith)
    return Promise.resolve(
      this.options.enrollment === undefined
        ? {
            id: 'enr-1',
            studentId: STUDENT_ID,
            classroomId: CLASSROOM_7A.id,
            semesterId: SEMESTER_ID,
          }
        : this.options.enrollment,
    )
  }
}

export const down = () =>
  new ServiceUnavailableException('student-service down')

export async function scheduleExam(
  fixtures: {
    packages: FakeExamPackageRepository
    schedules: FakeExamScheduleRepository
    questions: FakeQuestionRepository
  },
  overrides: { startsAt?: Date; endsAt?: Date; durationMinutes?: number } = {},
): Promise<ExamSchedule> {
  const pkg = await draftPackage(fixtures.packages, fixtures.questions)
  return new CreateExamScheduleUseCase(
    fixtures.schedules,
    fixtures.packages,
    new FakeAcademicLookup(),
  ).execute(
    USER,
    {
      packageId: pkg.id,
      classroomId: CLASSROOM_7A.id,
      startsAt: overrides.startsAt ?? STARTS,
      endsAt: overrides.endsAt ?? ENDS,
      durationMinutes: overrides.durationMinutes ?? 90,
    },
    new Date('2026-10-30T00:00:00.000Z'),
  )
}

export function sessionFor(
  schedule: ExamSchedule,
  overrides: Partial<ExamSession> = {},
): ExamSession {
  return {
    id: 'ses-1',
    scheduleId: schedule.id,
    studentId: STUDENT_ID,
    userId: STUDENT_USER.id,
    deviceId: 'device-1',
    enrollmentId: 'enr-1',
    shuffleSeed: 'seed-1',
    startedAt: NOW,
    deadline: new Date('2026-11-02T03:30:00.000Z'),
    finalizeAt: new Date('2026-11-02T03:40:00.000Z'),
    status: 'IN_PROGRESS',
    submittedAt: null,
    rawScore: null,
    maxScore: null,
    releasedAt: null,
    releasedById: null,
    gradedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

export const CHOICES = (['A', 'B', 'C', 'D', 'E'] as ChoiceKey[]).map(
  (key) => ({
    key,
    html: `<p>Pilihan ${key}</p>`,
  }),
)

export interface PaperQuestionSpec {
  type: QuestionType
  content: QuestionContent
  bodyHtml?: string
  points?: number
}

export const choiceSpec = (
  key: ChoiceKey = 'B',
  bodyHtml?: string,
): PaperQuestionSpec => ({
  type: 'MULTIPLE_CHOICE',
  content: { choices: CHOICES, answer: { key } },
  bodyHtml,
})

export async function schedulePaper(
  fixtures: {
    packages: FakeExamPackageRepository
    schedules: FakeExamScheduleRepository
    questions: FakeQuestionRepository
  },
  specs: PaperQuestionSpec[],
): Promise<{ schedule: ExamSchedule; questionIds: string[] }> {
  const ids: string[] = []
  for (const [index, spec] of specs.entries()) {
    const question = await seedApprovedQuestion(fixtures.questions, {
      type: spec.type,
      content: spec.content,
      bodyHtml: spec.bodyHtml ?? `<p>Soal ${index + 1}</p>`,
      points: spec.points ?? 2,
    })
    ids.push(question.id)
  }
  const pkg = await new CreateExamPackageUseCase(
    fixtures.packages,
    fixtures.questions,
  ).execute(USER, {
    title: 'UTS Matematika Kelas 7',
    subjectId: SUBJECT_ID,
    gradeId: GRADE_ID,
    questionIds: ids,
  })
  const schedule = await new CreateExamScheduleUseCase(
    fixtures.schedules,
    fixtures.packages,
    new FakeAcademicLookup(),
  ).execute(
    USER,
    {
      packageId: pkg.id,
      classroomId: CLASSROOM_7A.id,
      startsAt: STARTS,
      endsAt: ENDS,
      durationMinutes: 90,
    },
    new Date('2026-10-30T00:00:00.000Z'),
  )
  return { schedule, questionIds: ids }
}

export class FakeStudentDirectory extends IStudentDirectoryPort {
  constructor(
    private readonly refs: {
      id: string
      nis: string
      name: string | null
    }[] = [{ id: STUDENT_ID, nis: '2024001', name: 'Ahmad Fauzi' }],
  ) {
    super()
  }

  refsByIds(ids: string[]) {
    return Promise.resolve(this.refs.filter((ref) => ids.includes(ref.id)))
  }
}
