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
import { SubmitExamSessionUseCase } from './submit-exam-session.use-case.js'

describe('SubmitExamSessionUseCase', () => {
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
      useCase: new SubmitExamSessionUseCase(
        new SessionAccessService(sessions, finalizer),
        finalizer,
      ),
    }
  }

  it('hands in the session and reports the outcome', async () => {
    const { useCase } = await setup()

    expect(await useCase.execute(STUDENT_USER, 'a', NOW)).toEqual({
      status: 'GRADED',
      submittedAt: NOW,
    })
  })

  it('answers the same on a repeat', async () => {
    const { useCase } = await setup()
    const first = await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(
      await useCase.execute(
        STUDENT_USER,
        'a',
        new Date(NOW.getTime() + 60_000),
      ),
    ).toEqual(first)
  })

  it('refuses to hand in the session of someone else', async () => {
    const { useCase } = await setup()

    await expect(
      useCase.execute({ id: 'intruder', deviceId: 'device-1' }, 'a', NOW),
    ).rejects.toThrow(NotFoundException)
  })
})
