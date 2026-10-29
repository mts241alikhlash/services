import { ServiceUnavailableException } from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeExamScheduleRepository } from '../../../../exam-schedule/application/exam-schedule.repository.fake.js'
import {
  CLASSROOM_7A,
  FakeAcademicLookup,
} from '../../../../exam-schedule/application/exam-schedule.test-support.js'
import { SUBJECT_ID } from '../../../../exam-package/application/exam-package.test-support.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamSessionRepository } from '../../exam-session.repository.fake.js'
import {
  ENDS,
  FakeEnrollment,
  FakeStudentIdentity,
  NOW,
  STARTS,
  STUDENT_USER,
  down,
  scheduleExam,
  sessionFor,
} from '../../exam-session.test-support.js'
import { ListMyExamsUseCase } from './list-my-exams.use-case.js'

describe('ListMyExamsUseCase', () => {
  let packages: FakeExamPackageRepository
  let schedules: FakeExamScheduleRepository
  let questions: FakeQuestionRepository
  let sessions: FakeExamSessionRepository

  beforeEach(() => {
    packages = new FakeExamPackageRepository()
    schedules = new FakeExamScheduleRepository(packages)
    questions = new FakeQuestionRepository()
    sessions = new FakeExamSessionRepository()
  })

  const build = (
    students = new FakeStudentIdentity(),
    enrollments = new FakeEnrollment(),
    academic = new FakeAcademicLookup({
      subjects: [{ id: SUBJECT_ID, name: 'Matematika' }],
    }),
  ) =>
    new ListMyExamsUseCase(
      students,
      enrollments,
      schedules,
      packages,
      sessions,
      academic,
    )

  const fixtures = () => ({ packages, schedules, questions })

  it('lists the exams of the classroom the student is enrolled in', async () => {
    const exam = await scheduleExam(fixtures())

    const list = await build().execute(STUDENT_USER, NOW)

    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({
      id: exam.id,
      title: 'UTS Matematika Kelas 7',
      durationMinutes: 90,
      startsAt: STARTS,
      endsAt: ENDS,
      sessionId: null,
    })
    expect(list[0].subjectId).toBeTruthy()
  })

  it('carries the exam type and the subject name', async () => {
    await scheduleExam(fixtures(), { type: 'UTS' })

    const [exam] = await build().execute(STUDENT_USER, NOW)

    expect(exam).toMatchObject({ type: 'UTS', subjectName: 'Matematika' })
  })

  it('still lists the exams when the subject names cannot be fetched', async () => {
    await scheduleExam(fixtures())

    const [exam] = await build(
      new FakeStudentIdentity(),
      new FakeEnrollment(),
      new FakeAcademicLookup({ failWith: down() }),
    ).execute(STUDENT_USER, NOW)

    expect(exam.subjectName).toBeNull()
    expect(exam.type).toBe('UH')
  })

  it('leaves out the exams of another classroom and cancelled exams', async () => {
    const other = await scheduleExam(fixtures())
    schedules.schedules.set(other.id, { ...other, classroomId: 'other-room' })
    const cancelled = await scheduleExam(fixtures())
    schedules.schedules.set(cancelled.id, { ...cancelled, status: 'CANCELLED' })

    expect(await build().execute(STUDENT_USER, NOW)).toEqual([])
    expect(CLASSROOM_7A.id).toBeDefined()
  })

  it('derives the status of each exam for this student', async () => {
    const early = await scheduleExam(fixtures(), {
      startsAt: new Date('2026-11-02T05:00:00.000Z'),
      endsAt: new Date('2026-11-02T08:00:00.000Z'),
    })
    const open = await scheduleExam(fixtures())
    const running = await scheduleExam(fixtures())
    const submitted = await scheduleExam(fixtures())
    const missed = await scheduleExam(fixtures(), {
      startsAt: new Date('2026-11-01T01:00:00.000Z'),
      endsAt: new Date('2026-11-01T04:00:00.000Z'),
    })
    sessions.sessions.set('a', sessionFor(running, { id: 'a' }))
    sessions.sessions.set(
      'b',
      sessionFor(submitted, { id: 'b', status: 'SUBMITTED' }),
    )

    const list = await build().execute(STUDENT_USER, NOW)
    const statusOf = (id: string) => list.find((row) => row.id === id)?.status

    expect(statusOf(early.id)).toBe('UPCOMING')
    expect(statusOf(open.id)).toBe('OPEN')
    expect(statusOf(running.id)).toBe('IN_PROGRESS')
    expect(statusOf(submitted.id)).toBe('FINISHED')
    expect(statusOf(missed.id)).toBe('FINISHED')
    expect(list.find((row) => row.id === running.id)?.sessionId).toBe('a')
  })

  it('puts what the student can enter first', async () => {
    const missed = await scheduleExam(fixtures(), {
      startsAt: new Date('2026-11-01T01:00:00.000Z'),
      endsAt: new Date('2026-11-01T04:00:00.000Z'),
    })
    const later = await scheduleExam(fixtures(), {
      startsAt: new Date('2026-11-03T01:00:00.000Z'),
      endsAt: new Date('2026-11-03T04:00:00.000Z'),
    })
    const running = await scheduleExam(fixtures())
    const open = await scheduleExam(fixtures())
    sessions.sessions.set('a', sessionFor(running, { id: 'a' }))

    const ids = (await build().execute(STUDENT_USER, NOW)).map((row) => row.id)

    expect(ids).toEqual([running.id, open.id, later.id, missed.id])
  })

  it('returns nothing for an account that is not a student', async () => {
    await scheduleExam(fixtures())

    expect(
      await build(new FakeStudentIdentity({ studentId: null })).execute(
        STUDENT_USER,
        NOW,
      ),
    ).toEqual([])
  })

  it('returns nothing without an active enrollment', async () => {
    await scheduleExam(fixtures())

    expect(
      await build(undefined, new FakeEnrollment({ enrollment: null })).execute(
        STUDENT_USER,
        NOW,
      ),
    ).toEqual([])
  })

  it('fails closed when student-service is down', async () => {
    await expect(
      build(new FakeStudentIdentity({ failWith: down() })).execute(
        STUDENT_USER,
        NOW,
      ),
    ).rejects.toThrow(ServiceUnavailableException)
    await expect(
      build(undefined, new FakeEnrollment({ failWith: down() })).execute(
        STUDENT_USER,
        NOW,
      ),
    ).rejects.toThrow(ServiceUnavailableException)
  })
})
