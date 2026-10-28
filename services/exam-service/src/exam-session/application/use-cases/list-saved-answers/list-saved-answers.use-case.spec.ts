import { NotFoundException } from '@nestjs/common'
import { FakeExamSessionRepository } from '../../exam-session.repository.fake.js'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeExamScheduleRepository } from '../../../../exam-schedule/application/exam-schedule.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import {
  NOW,
  STUDENT_USER,
  choiceSpec,
  schedulePaper,
  sessionFor,
} from '../../exam-session.test-support.js'
import { FakeSessionFinalizer } from '../../session-finalizer.fake.js'
import { SessionAccessService } from '../../session-access.service.js'
import { ListSavedAnswersUseCase } from './list-saved-answers.use-case.js'

describe('ListSavedAnswersUseCase', () => {
  it('returns the answers saved for the session of the student', async () => {
    const packages = new FakeExamPackageRepository()
    const schedules = new FakeExamScheduleRepository(packages)
    const questions = new FakeQuestionRepository()
    const sessions = new FakeExamSessionRepository()
    const { schedule, questionIds } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec()],
    )
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a' }))
    sessions.answers.set('x', {
      id: 'x',
      sessionId: 'a',
      questionId: questionIds[0],
      answer: { key: 'C' },
      clientId: 'client-1',
      receivedAfterDeadline: false,
      score: null,
      createdAt: NOW,
      updatedAt: NOW,
    })
    const useCase = new ListSavedAnswersUseCase(
      new SessionAccessService(sessions, new FakeSessionFinalizer()),
      sessions,
    )

    expect(await useCase.execute(STUDENT_USER, 'a', NOW)).toEqual([
      { questionId: questionIds[0], answer: { key: 'C' } },
    ])
    await expect(
      useCase.execute({ id: 'intruder', deviceId: 'device-1' }, 'a', NOW),
    ).rejects.toThrow(NotFoundException)
  })
})
