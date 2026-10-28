import { ConflictException, NotFoundException } from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeExamScheduleRepository } from '../../../../exam-schedule/application/exam-schedule.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamAccessAttemptRepository } from '../../exam-access-attempt.repository.fake.js'
import { FakeExamSessionRepository } from '../../exam-session.repository.fake.js'
import { AccessCodeService } from '../../../../exam-schedule/application/access-code.service.js'
import {
  FakeEnrollment,
  FakeStudentDirectory,
  FakeStudentIdentity,
  NOW,
  STUDENT_USER,
  choiceSpec,
  schedulePaper,
  sessionFor,
} from '../../exam-session.test-support.js'
import { FakeSessionFinalizer } from '../../session-finalizer.fake.js'
import { StartExamSessionUseCase } from '../start-exam-session/start-exam-session.use-case.js'
import { ListScheduleSessionsUseCase } from '../list-schedule-sessions/list-schedule-sessions.use-case.js'
import { ReleaseSessionUseCase } from './release-session.use-case.js'

const STAFF = { id: 'staff-1' }
const codes = new AccessCodeService(
  'unit-test-secret-of-at-least-32-characters',
)

describe('ReleaseSessionUseCase', () => {
  async function setup() {
    const packages = new FakeExamPackageRepository()
    const schedules = new FakeExamScheduleRepository(packages)
    const questions = new FakeQuestionRepository()
    const sessions = new FakeExamSessionRepository()
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec('B')],
    )
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a' }))
    return {
      schedule,
      schedules,
      sessions,
      release: new ReleaseSessionUseCase(sessions),
    }
  }

  it('frees the device and keeps seed and deadline', async () => {
    const { sessions, release } = await setup()
    const before = sessions.sessions.get('a')!

    const released = await release.execute(STAFF, 'a', NOW)

    expect(released).toMatchObject({
      deviceId: null,
      releasedAt: NOW,
      releasedById: STAFF.id,
      shuffleSeed: before.shuffleSeed,
      deadline: before.deadline,
    })
  })

  it('is refused for a finished session', async () => {
    const { schedule, sessions, release } = await setup()
    sessions.sessions.set(
      'done',
      sessionFor(schedule, { id: 'done', status: 'SUBMITTED' }),
    )

    await expect(release.execute(STAFF, 'done', NOW)).rejects.toThrow(
      ConflictException,
    )
    await expect(release.execute(STAFF, 'missing', NOW)).rejects.toThrow(
      NotFoundException,
    )
  })

  it('lets the student resume on another device afterwards', async () => {
    const { schedule, schedules, sessions, release } = await setup()
    const start = new StartExamSessionUseCase(
      new FakeStudentIdentity(),
      new FakeEnrollment(),
      schedules,
      sessions,
      new FakeExamAccessAttemptRepository(),
      codes,
      new FakeSessionFinalizer(),
    )
    const input = (deviceId: string) => ({
      accessCode: codes.codeFor(schedule.id, schedule.tokenRotation),
      deviceId,
    })
    const first = await start.execute(
      STUDENT_USER,
      schedule.id,
      input('device-1'),
      NOW,
    )
    await expect(
      start.execute(STUDENT_USER, schedule.id, input('device-2'), NOW),
    ).rejects.toThrow(ConflictException)

    await release.execute(STAFF, first.sessionId, NOW)
    const resumed = await start.execute(
      STUDENT_USER,
      schedule.id,
      input('device-2'),
      NOW,
    )

    expect(resumed.sessionId).toBe(first.sessionId)
    expect(sessions.sessions.get(first.sessionId)?.deviceId).toBe('device-2')
  })

  it('lists the sessions of a schedule with paging and 404 for an unknown schedule', async () => {
    const { schedule, schedules, sessions } = await setup()
    const list = new ListScheduleSessionsUseCase(
      schedules,
      sessions,
      new FakeStudentDirectory(),
    )

    expect(await list.execute(schedule.id, 1, 10)).toMatchObject({
      total: 1,
      page: 1,
      limit: 10,
    })
    await expect(list.execute('missing')).rejects.toThrow(NotFoundException)
  })

  it('carries the student name and nis, and tolerates a student that is gone', async () => {
    const { schedule, schedules, sessions } = await setup()

    const known = await new ListScheduleSessionsUseCase(
      schedules,
      sessions,
      new FakeStudentDirectory(),
    ).execute(schedule.id)
    const missing = await new ListScheduleSessionsUseCase(
      schedules,
      sessions,
      new FakeStudentDirectory([]),
    ).execute(schedule.id)

    expect(known.data[0]).toMatchObject({
      studentName: 'Ahmad Fauzi',
      studentNis: '2024001',
    })
    expect(missing.data[0]).toMatchObject({
      studentName: null,
      studentNis: null,
    })
  })
})
