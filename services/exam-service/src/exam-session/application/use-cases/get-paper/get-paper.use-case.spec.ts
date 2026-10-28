import { ConflictException, NotFoundException } from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeExamScheduleRepository } from '../../../../exam-schedule/application/exam-schedule.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import { FakeExamSessionRepository } from '../../exam-session.repository.fake.js'
import {
  NOW,
  STUDENT_USER,
  choiceSpec,
  schedulePaper,
  sessionFor,
} from '../../exam-session.test-support.js'
import { FakeSessionFinalizer } from '../../session-finalizer.fake.js'
import { SessionAccessService } from '../../session-access.service.js'
import { GetPaperUseCase } from './get-paper.use-case.js'

describe('GetPaperUseCase', () => {
  let packages: FakeExamPackageRepository
  let schedules: FakeExamScheduleRepository
  let questions: FakeQuestionRepository
  let sessions: FakeExamSessionRepository
  let finalizer: FakeSessionFinalizer
  let useCase: GetPaperUseCase

  beforeEach(() => {
    packages = new FakeExamPackageRepository()
    schedules = new FakeExamScheduleRepository(packages)
    questions = new FakeQuestionRepository()
    sessions = new FakeExamSessionRepository()
    finalizer = new FakeSessionFinalizer()
    useCase = new GetPaperUseCase(
      new SessionAccessService(sessions, finalizer),
      schedules,
      packages,
      questions,
    )
  })

  const twelve = () => Array.from({ length: 12 }, () => choiceSpec())

  it('returns the same order on every call and another one for another session', async () => {
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      twelve(),
    )
    sessions.sessions.set(
      'a',
      sessionFor(schedule, { id: 'a', shuffleSeed: 'seed-a' }),
    )
    sessions.sessions.set(
      'b',
      sessionFor(schedule, {
        id: 'b',
        shuffleSeed: 'seed-b',
        userId: 'user-b',
      }),
    )

    const first = await useCase.execute(STUDENT_USER, 'a', NOW)
    const again = await useCase.execute(STUDENT_USER, 'a', NOW)
    const other = await useCase.execute(
      { id: 'user-b', deviceId: 'device-1' },
      'b',
      NOW,
    )

    expect(first).toEqual(again)
    expect(first.map((q) => q.questionId)).not.toEqual(
      other.map((q) => q.questionId),
    )
    expect(first.map((q) => q.number)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1),
    )
  })

  it('never contains an answer key', async () => {
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [
        choiceSpec('C'),
        {
          type: 'TRUE_FALSE',
          content: { answer: { value: true } },
        },
      ],
    )
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a' }))

    const json = JSON.stringify(await useCase.execute(STUDENT_USER, 'a', NOW))

    expect(json).not.toContain('answer')
    expect(json).toContain('Pilihan A')
  })

  it("answers 404 to someone else's session and to one that does not exist", async () => {
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec()],
    )
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a' }))

    await expect(
      useCase.execute({ id: 'intruder', deviceId: 'device-1' }, 'a', NOW),
    ).rejects.toThrow(NotFoundException)
    await expect(useCase.execute(STUDENT_USER, 'missing', NOW)).rejects.toThrow(
      NotFoundException,
    )
  })

  it('refuses to hand out the paper once the sending time has passed', async () => {
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec()],
    )
    const session = sessionFor(schedule, { id: 'a' })
    sessions.sessions.set('a', session)

    await expect(
      useCase.execute(STUDENT_USER, 'a', session.finalizeAt),
    ).rejects.toThrow(ConflictException)
  })

  it('lets the finalizer run before it answers', async () => {
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec()],
    )
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a' }))

    await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(finalizer.calls).toEqual(['a'])
  })

  it('refuses a device the session is not bound to', async () => {
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec()],
    )
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a' }))

    await expect(
      useCase.execute({ ...STUDENT_USER, deviceId: 'device-2' }, 'a', NOW),
    ).rejects.toThrow(
      'Sesi aktif di perangkat lain. Minta pengawas melepas sesi',
    )
  })

  it('asks to start again after the session was released', async () => {
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec()],
    )
    sessions.sessions.set(
      'a',
      sessionFor(schedule, { id: 'a', deviceId: null }),
    )

    await expect(useCase.execute(STUDENT_USER, 'a', NOW)).rejects.toThrow(
      'Sesi dilepas. Mulai ujian lagi',
    )
  })
})
