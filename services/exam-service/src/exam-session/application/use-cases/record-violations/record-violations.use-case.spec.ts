import { NotFoundException } from '@nestjs/common'
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
import { RecordViolationsUseCase } from './record-violations.use-case.js'

describe('RecordViolationsUseCase', () => {
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
    const finalizer = new FinalizeSessionService(
      sessions,
      schedules,
      packages,
      questions,
    )
    return {
      sessions,
      useCase: new RecordViolationsUseCase(
        new SessionAccessService(sessions, finalizer),
        sessions,
      ),
    }
  }

  it('keeps the count the app reports and answers with what the server holds', async () => {
    const { useCase, sessions } = await setup()

    expect(await useCase.execute(STUDENT_USER, 'a', 2, NOW)).toBe(2)
    expect(sessions.sessions.get('a')?.violationCount).toBe(2)
  })

  it('never lowers the count, so a wiped app learns the real one', async () => {
    const { useCase } = await setup()
    await useCase.execute(STUDENT_USER, 'a', 3, NOW)

    expect(await useCase.execute(STUDENT_USER, 'a', 0, NOW)).toBe(3)
    expect(await useCase.execute(STUDENT_USER, 'a', 1, NOW)).toBe(3)
  })

  it('answers with the count and changes nothing once the session is closed', async () => {
    const { useCase, sessions } = await setup()
    const open = sessions.sessions.get('a')!
    sessions.sessions.set('a', {
      ...open,
      status: 'SUBMITTED',
      violationCount: 4,
    })

    expect(await useCase.execute(STUDENT_USER, 'a', 9, NOW)).toBe(4)
  })

  it('refuses the session of someone else', async () => {
    const { useCase } = await setup()

    await expect(
      useCase.execute({ id: 'intruder', deviceId: 'device-1' }, 'a', 1, NOW),
    ).rejects.toThrow(NotFoundException)
  })
})
