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
import { ReportCameraBlockedUseCase } from './report-camera-blocked.use-case.js'

describe('ReportCameraBlockedUseCase', () => {
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
      useCase: new ReportCameraBlockedUseCase(
        new SessionAccessService(sessions, finalizer),
        sessions,
      ),
    }
  }

  it('records why the camera is not streaming', async () => {
    const { useCase, sessions } = await setup()

    await useCase.execute(STUDENT_USER, 'a', 'permission', NOW)

    expect(sessions.sessions.get('a')?.cameraBlocked).toBe('permission')
  })

  it('never counts as a violation', async () => {
    const { useCase, sessions } = await setup({ violationCount: 1 })

    await useCase.execute(STUDENT_USER, 'a', 'network', NOW)

    expect(sessions.sessions.get('a')?.violationCount).toBe(1)
  })

  it('keeps the first reason so repeated reports do not churn the row', async () => {
    const { useCase, sessions } = await setup()

    await useCase.execute(STUDENT_USER, 'a', 'network', NOW)
    await useCase.execute(STUDENT_USER, 'a', 'battery', NOW)

    expect(sessions.sessions.get('a')?.cameraBlocked).toBe('network')
  })

  it('clears the reason when the stream comes back', async () => {
    const { sessions } = await setup()
    sessions.sessions.set('a', {
      ...sessions.sessions.get('a')!,
      cameraBlocked: 'network',
    })

    await sessions.touchStream('a', 'n2', NOW)

    expect(sessions.sessions.get('a')?.cameraBlocked).toBeNull()
  })

  it('ignores a session that is no longer running', async () => {
    const { useCase, sessions } = await setup({ status: 'SUBMITTED' })

    await useCase.execute(STUDENT_USER, 'a', 'network', NOW)

    expect(sessions.sessions.get('a')?.cameraBlocked).toBeNull()
  })
})
