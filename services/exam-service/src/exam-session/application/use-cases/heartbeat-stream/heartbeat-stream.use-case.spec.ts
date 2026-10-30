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
import { FinalizeSessionService } from '../../finalize-session.service.js'
import { SessionAccessService } from '../../session-access.service.js'
import { HeartbeatStreamUseCase } from './heartbeat-stream.use-case.js'

describe('HeartbeatStreamUseCase', () => {
  async function setup(overrides: Record<string, unknown> = {}) {
    const packages = new FakeExamPackageRepository()
    const schedules = new FakeExamScheduleRepository(packages)
    const questions = new FakeQuestionRepository()
    const sessions = new FakeExamSessionRepository()
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec('B')],
    )
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a', ...overrides }))
    const finalizer = new FinalizeSessionService(
      sessions,
      schedules,
      packages,
      questions,
    )
    return {
      sessions,
      useCase: new HeartbeatStreamUseCase(
        new SessionAccessService(sessions, finalizer),
        sessions,
      ),
    }
  }

  it('refreshes lastSeenAt', async () => {
    const { useCase, sessions } = await setup({
      status: 'IN_PROGRESS',
      streamNonce: 'n1',
    })

    await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(sessions.sessions.get('a')?.lastSeenAt).toEqual(NOW)
  })

  it('never rotates the nonce the running stream is using', async () => {
    const { useCase, sessions } = await setup({
      status: 'IN_PROGRESS',
      streamNonce: 'n1',
    })

    await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(sessions.sessions.get('a')?.streamNonce).toBe('n1')
  })

  it('does nothing for a session that never streamed', async () => {
    const { useCase, sessions } = await setup({
      status: 'IN_PROGRESS',
      streamNonce: null,
    })

    await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(sessions.sessions.get('a')?.lastSeenAt).toBeNull()
  })

  it('does nothing once the session is no longer running', async () => {
    const { useCase, sessions } = await setup({
      status: 'SUBMITTED',
      streamNonce: 'n1',
    })

    await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(sessions.sessions.get('a')?.lastSeenAt).toBeNull()
  })
})
