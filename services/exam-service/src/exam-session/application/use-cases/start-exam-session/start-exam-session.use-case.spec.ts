import {
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { AccessCodeService } from '../../../../exam-schedule/application/access-code.service.js'
import { FakeExamScheduleRepository } from '../../../../exam-schedule/application/exam-schedule.repository.fake.js'
import type { ExamSchedule } from '../../../../exam-schedule/domain/entities/exam-schedule.entity.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamAccessAttemptRepository } from '../../exam-access-attempt.repository.fake.js'
import { FakeExamSessionRepository } from '../../exam-session.repository.fake.js'
import {
  ENDS,
  FakeEnrollment,
  FakeStudentIdentity,
  NOW,
  STARTS,
  STUDENT_ID,
  STUDENT_USER,
  scheduleExam,
  sessionFor,
} from '../../exam-session.test-support.js'
import { FinalizeSessionService } from '../../finalize-session.service.js'
import { StartExamSessionUseCase } from './start-exam-session.use-case.js'

const codes = new AccessCodeService(
  'unit-test-secret-of-at-least-32-characters',
)

describe('StartExamSessionUseCase', () => {
  let packages: FakeExamPackageRepository
  let schedules: FakeExamScheduleRepository
  let questions: FakeQuestionRepository
  let sessions: FakeExamSessionRepository
  let attempts: FakeExamAccessAttemptRepository
  let schedule: ExamSchedule

  beforeEach(async () => {
    packages = new FakeExamPackageRepository()
    schedules = new FakeExamScheduleRepository(packages)
    questions = new FakeQuestionRepository()
    sessions = new FakeExamSessionRepository()
    attempts = new FakeExamAccessAttemptRepository()
    schedule = await scheduleExam({ packages, schedules, questions })
  })

  const build = (
    students = new FakeStudentIdentity(),
    enrollments = new FakeEnrollment(),
  ) =>
    new StartExamSessionUseCase(
      students,
      enrollments,
      schedules,
      sessions,
      attempts,
      codes,
      new FinalizeSessionService(sessions, schedules, packages, questions),
    )

  const start = (
    useCase: StartExamSessionUseCase,
    overrides: { code?: string; device?: string; now?: Date } = {},
  ) =>
    useCase.execute(
      STUDENT_USER,
      schedule.id,
      {
        accessCode:
          overrides.code ?? codes.codeFor(schedule.id, schedule.tokenRotation),
        deviceId: overrides.device ?? 'device-1',
      },
      overrides.now ?? NOW,
    )

  it('starts a session whose deadline follows the duration', async () => {
    const started = await start(build())

    expect(started.deadline).toEqual(new Date('2026-11-02T03:30:00.000Z'))
    expect(started.serverTime).toEqual(NOW)
    const stored = await sessions.findById(started.sessionId)
    expect(stored).toMatchObject({
      studentId: STUDENT_ID,
      userId: STUDENT_USER.id,
      deviceId: 'device-1',
      status: 'IN_PROGRESS',
      finalizeAt: new Date('2026-11-02T03:40:00.000Z'),
    })
    expect(stored?.shuffleSeed).toMatch(/^[0-9a-f]{32}$/)
  })

  it('cuts the deadline at the end of the window for a late start', async () => {
    const started = await start(build(), {
      now: new Date('2026-11-02T03:30:00.000Z'),
    })

    expect(started.deadline).toEqual(ENDS)
  })

  it('gives each student a seed of their own', async () => {
    const first = await start(build())
    const other = await build(
      new FakeStudentIdentity({ studentId: 'other' }),
    ).execute(
      { id: 'other-user' },
      schedule.id,
      { accessCode: codes.codeFor(schedule.id, 0), deviceId: 'device-2' },
      NOW,
    )

    expect((await sessions.findById(first.sessionId))?.shuffleSeed).not.toBe(
      (await sessions.findById(other.sessionId))?.shuffleSeed,
    )
  })

  it('returns the same session to the same device', async () => {
    const first = await start(build())
    const again = await start(build())

    expect(again.sessionId).toBe(first.sessionId)
    expect(again.deadline).toEqual(first.deadline)
    expect(sessions.sessions.size).toBe(1)
  })

  it('still wants the access code to resume', async () => {
    await start(build())

    await expect(start(build(), { code: 'AAAAAA' })).rejects.toThrow(
      ForbiddenException,
    )
  })

  it('refuses another device with 409 while the session is bound', async () => {
    await start(build())

    await expect(start(build(), { device: 'device-2' })).rejects.toThrow(
      'Sesi aktif di perangkat lain. Minta pengawas melepas sesi',
    )
    await expect(start(build(), { device: 'device-2' })).rejects.toThrow(
      ConflictException,
    )
  })

  it('binds a released session to the new device and keeps seed and deadline', async () => {
    const first = await start(build())
    const before = await sessions.findById(first.sessionId)
    sessions.sessions.set(first.sessionId, { ...before!, deviceId: null })

    const resumed = await start(build(), { device: 'device-2' })

    const after = await sessions.findById(first.sessionId)
    expect(resumed.sessionId).toBe(first.sessionId)
    expect(after?.deviceId).toBe('device-2')
    expect(after?.shuffleSeed).toBe(before?.shuffleSeed)
    expect(after?.deadline).toEqual(before?.deadline)
  })

  it('refuses a session that was already handed in', async () => {
    sessions.sessions.set(
      'done',
      sessionFor(schedule, { id: 'done', status: 'SUBMITTED' }),
    )

    await expect(start(build())).rejects.toThrow('Ujian sudah dikumpulkan')
  })

  it('creates one session for two simultaneous starts from the same device', async () => {
    const [a, b] = await Promise.all([start(build()), start(build())])

    expect(a.sessionId).toBe(b.sessionId)
    expect(sessions.sessions.size).toBe(1)
  })

  it('lets only one of two simultaneous starts from different devices in', async () => {
    const results = await Promise.allSettled([
      start(build(), { device: 'device-1' }),
      start(build(), { device: 'device-2' }),
    ])

    expect(results.filter((row) => row.status === 'fulfilled')).toHaveLength(1)
    expect(sessions.sessions.size).toBe(1)
  })

  it('refuses a student of another classroom', async () => {
    const other = new FakeEnrollment({
      enrollment: {
        id: 'e',
        studentId: STUDENT_ID,
        classroomId: 'room-8a',
        semesterId: schedule.semesterId,
      },
    })

    await expect(start(build(undefined, other))).rejects.toThrow(
      'Ujian ini bukan untuk kelas Anda',
    )
  })

  it('refuses an account that is not a student and a student without enrollment', async () => {
    await expect(
      start(build(new FakeStudentIdentity({ studentId: null }))),
    ).rejects.toThrow(ForbiddenException)
    await expect(
      start(build(undefined, new FakeEnrollment({ enrollment: null }))),
    ).rejects.toThrow(ForbiddenException)
  })

  it('answers 404 for a schedule that does not exist', async () => {
    await expect(
      build().execute(
        STUDENT_USER,
        'missing',
        { accessCode: 'AAAAAA', deviceId: 'd' },
        NOW,
      ),
    ).rejects.toThrow(NotFoundException)
  })

  it('refuses before the window opens and from the moment it closes', async () => {
    await expect(
      start(build(), { now: new Date(STARTS.getTime() - 1000) }),
    ).rejects.toThrow('Ujian belum dibuka')
    await expect(start(build(), { now: ENDS })).rejects.toThrow(
      'Waktu ujian sudah berakhir',
    )
  })

  it('refuses a cancelled schedule', async () => {
    schedules.schedules.set(schedule.id, { ...schedule, status: 'CANCELLED' })

    await expect(start(build())).rejects.toThrow(
      'Jadwal ujian sudah dibatalkan',
    )
  })

  it('refuses a wrong code and the code from before a rotation', async () => {
    const old = codes.codeFor(schedule.id, 0)
    schedules.schedules.set(schedule.id, { ...schedule, tokenRotation: 1 })

    await expect(start(build(), { code: 'AAAAAA' })).rejects.toThrow(
      'Token ujian salah',
    )
    await expect(start(build(), { code: old })).rejects.toThrow(
      'Token ujian salah',
    )
    expect(sessions.sessions.size).toBe(0)
  })

  it('locks after five wrong codes, even for the right code, and unlocks later', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(start(build(), { code: 'AAAAAA' })).rejects.toThrow(
        'Token ujian salah',
      )
    }

    const locked = await start(build()).catch((error: unknown) => error)
    expect(locked).toBeInstanceOf(HttpException)
    expect((locked as HttpException).getStatus()).toBe(429)

    const later = await start(build(), {
      now: new Date(NOW.getTime() + 6 * 60_000),
    })
    expect(later.sessionId).toBeDefined()
  })

  it('clears the failures after a correct code', async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      await expect(start(build(), { code: 'AAAAAA' })).rejects.toThrow(
        'Token ujian salah',
      )
    }
    await start(build())

    expect(await attempts.get(schedule.id, STUDENT_ID)).toEqual({
      failures: 0,
      lockedUntil: null,
    })
  })

  it('closes a session whose sending time passed instead of resuming it', async () => {
    sessions.sessions.set(
      'late',
      sessionFor(schedule, {
        id: 'late',
        deadline: new Date('2026-11-02T01:40:00.000Z'),
        finalizeAt: new Date('2026-11-02T01:50:00.000Z'),
      }),
    )

    await expect(start(build())).rejects.toThrow('Ujian sudah dikumpulkan')
    expect(sessions.sessions.get('late')?.status).not.toBe('IN_PROGRESS')
  })
})
