import { FakeExamPackageRepository } from '../../exam-package/application/exam-package.repository.fake.js'
import { FakeExamScheduleRepository } from '../../exam-schedule/application/exam-schedule.repository.fake.js'
import { FakeQuestionRepository } from '../../question/application/question.repository.fake.js'
import type { ChoiceKey } from '../../question/domain/value-objects/question-content.js'
import type { AnswerPayload } from '../domain/policies/validate-answer-shape.policy.js'
import { FinalizeDueSessionsUseCase } from './use-cases/finalize-due-sessions/finalize-due-sessions.use-case.js'
import { FinalizeSessionService } from './finalize-session.service.js'
import { FakeExamSessionRepository } from './exam-session.repository.fake.js'
import {
  CHOICES,
  NOW,
  choiceSpec,
  schedulePaper,
  sessionFor,
  type PaperQuestionSpec,
} from './exam-session.test-support.js'

const LATER = new Date('2026-11-02T03:10:00.000Z')

describe('FinalizeSessionService', () => {
  let packages: FakeExamPackageRepository
  let schedules: FakeExamScheduleRepository
  let questions: FakeQuestionRepository
  let sessions: FakeExamSessionRepository
  let service: FinalizeSessionService

  beforeEach(() => {
    packages = new FakeExamPackageRepository()
    schedules = new FakeExamScheduleRepository(packages)
    questions = new FakeQuestionRepository()
    sessions = new FakeExamSessionRepository()
    service = new FinalizeSessionService(
      sessions,
      schedules,
      packages,
      questions,
    )
  })

  async function start(specs: PaperQuestionSpec[]) {
    const { schedule, questionIds } = await schedulePaper(
      { packages, schedules, questions },
      specs,
    )
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a' }))
    return questionIds
  }

  const answer = (
    questionId: string,
    payload: AnswerPayload,
    id = questionId,
  ) =>
    sessions.answers.set(id, {
      id,
      sessionId: 'a',
      questionId,
      answer: payload,
      clientId: `c-${id}`,
      receivedAfterDeadline: false,
      score: null,
      gradedById: null,
      gradedAt: null,
      gradeNote: null,
      createdAt: NOW,
      updatedAt: NOW,
    })

  const multipleResponse: PaperQuestionSpec = {
    type: 'MULTIPLE_RESPONSE',
    content: {
      choices: CHOICES,
      answer: { keys: ['A', 'B'] as ChoiceKey[] },
    },
    points: 4,
  }

  it('scores every objective type and leaves manual types ungraded', async () => {
    const [mc, mr, tf, short] = await start([
      choiceSpec('B'),
      multipleResponse,
      { type: 'TRUE_FALSE', content: { answer: { value: true } } },
      {
        type: 'SHORT_ANSWER',
        content: {
          answer: { accepted: ['x'], ignoreCase: true, ignoreHarakat: true },
        },
      },
    ])
    answer(mc, { key: 'B' })
    answer(mr, { keys: ['A', 'C'] })
    answer(tf, { value: true })
    answer(short, { text: 'x' })

    const closed = await service.finalize('a', 'SUBMITTED', NOW)

    expect(closed).toMatchObject({
      status: 'SUBMITTED',
      rawScore: 4,
      maxScore: 10,
    })
    expect(sessions.answers.get(mc)?.score).toBe(2)
    expect(sessions.answers.get(mr)?.score).toBe(0)
    expect(sessions.answers.get(tf)?.score).toBe(2)
    expect(sessions.answers.get(short)?.score).toBeNull()
    expect(closed.submittedAt).toEqual(NOW)
  })

  it('marks the session graded when the package has no manual question', async () => {
    const [mc] = await start([choiceSpec('B')])
    answer(mc, { key: 'B' })

    expect((await service.finalize('a', 'SUBMITTED', NOW)).status).toBe(
      'GRADED',
    )
  })

  it('keeps it submitted when a manual question has text to grade', async () => {
    const [, essay] = await start([
      choiceSpec('B'),
      { type: 'ESSAY', content: { guideHtml: null } },
    ])
    answer(essay, { text: 'jawaban' })

    expect((await service.finalize('a', 'SUBMITTED', NOW)).status).toBe(
      'SUBMITTED',
    )
  })

  it('scores an unanswered objective question as zero', async () => {
    await start([choiceSpec('B'), choiceSpec('C')])

    const closed = await service.finalize('a', 'SUBMITTED', NOW)

    expect(closed).toMatchObject({ rawScore: 0, maxScore: 4, status: 'GRADED' })
  })

  describe('sending the score to the assessment', () => {
    it('sends nothing for a session the clock closed with no answer at all', async () => {
      await start([choiceSpec('B')])

      const closed = await service.finalize('a', 'EXPIRED', LATER)

      expect(closed.status).toBe('GRADED')
      expect(sessions.publications.has('a')).toBe(false)
    })

    it('sends the score of a session the clock closed after some answers', async () => {
      const [questionId] = await start([choiceSpec('B')])
      answer(questionId, { key: 'A' })

      await service.finalize('a', 'EXPIRED', LATER)

      expect(sessions.publications.get('a')).toBe('PENDING')
    })

    it('sends the score of a student who handed in an empty paper', async () => {
      await start([choiceSpec('B')])

      await service.finalize('a', 'SUBMITTED', NOW)

      expect(sessions.publications.get('a')).toBe('PENDING')
    })
  })

  it('submitting twice leaves the score unchanged', async () => {
    const [mc] = await start([choiceSpec('B')])
    answer(mc, { key: 'B' })

    const first = await service.finalize('a', 'SUBMITTED', NOW)
    answer(mc, { key: 'C' }, 'x2')
    const second = await service.finalize('a', 'SUBMITTED', LATER)

    expect(second).toEqual(first)
    expect(second.rawScore).toBe(2)
  })

  it('two finalizations at once score once', async () => {
    const [mc] = await start([choiceSpec('B')])
    answer(mc, { key: 'B' })
    const closeSpy = jest.spyOn(sessions, 'close')

    const [a, b] = await Promise.all([
      service.finalize('a', 'SUBMITTED', NOW),
      service.finalize('a', 'EXPIRED', NOW),
    ])

    expect(a).toEqual(b)
    const outcomes = await Promise.all(
      closeSpy.mock.results.map((result) => result.value as Promise<unknown>),
    )
    expect(outcomes.filter((outcome) => outcome !== null)).toHaveLength(1)
    expect(a.status).toBe('GRADED')
  })

  it('finalizeIfDue closes only after finalizeAt', async () => {
    await start([choiceSpec('B')])
    const session = sessions.sessions.get('a')!

    expect((await service.finalizeIfDue(session, NOW)).status).toBe(
      'IN_PROGRESS',
    )
    const closed = await service.finalizeIfDue(session, session.finalizeAt)
    expect(closed.status).toBe('GRADED')
    expect(closed.submittedAt).toBeNull()
  })

  it('the job closes a session whose finalize time passed and scores what arrived', async () => {
    const [mc] = await start([choiceSpec('B')])
    answer(mc, { key: 'B' })
    const session = sessions.sessions.get('a')!
    sessions.sessions.set(
      'b',
      sessionFor({ id: 'x' } as never, {
        id: 'b',
        finalizeAt: new Date('2027-01-01'),
      }),
    )
    const job = new FinalizeDueSessionsUseCase(sessions, service)

    const closed = await job.execute(session.finalizeAt)

    expect(closed).toBe(1)
    expect(sessions.sessions.get('a')).toMatchObject({
      status: 'GRADED',
      rawScore: 2,
    })
    expect(sessions.sessions.get('b')?.status).toBe('IN_PROGRESS')
  })

  it('the job drains more than one batch and skips a session that keeps failing', async () => {
    const { schedule } = await schedulePaper(
      { packages, schedules, questions },
      [choiceSpec('B')],
    )
    const past = new Date('2026-11-02T01:00:00.000Z')
    for (let index = 0; index < 120; index += 1) {
      const id = `s${index}`
      sessions.sessions.set(id, sessionFor(schedule, { id, finalizeAt: past }))
    }
    sessions.sessions.set(
      'poison',
      sessionFor({ id: 'missing-schedule' } as never, {
        id: 'poison',
        finalizeAt: past,
      }),
    )
    const job = new FinalizeDueSessionsUseCase(sessions, service)

    const closed = await job.execute(NOW)

    expect(closed).toBe(120)
    expect(sessions.sessions.get('poison')?.status).toBe('IN_PROGRESS')
    expect(sessions.sessions.get('s119')?.status).toBe('GRADED')
  })

  it('a blank essay scores zero and does not hold the session', async () => {
    const [, essay] = await start([
      choiceSpec('B'),
      { type: 'ESSAY', content: { guideHtml: null } },
    ])
    answer(essay, { text: '  ' })

    const closed = await service.finalize('a', 'SUBMITTED', NOW)

    expect(closed.status).toBe('GRADED')
    expect(sessions.answers.get(essay)?.score).toBe(0)
  })

  it('creates a pending publication when nothing is left to grade', async () => {
    await start([choiceSpec('B')])

    const closed = await service.finalize('a', 'SUBMITTED', NOW)

    expect(closed.gradedAt).toEqual(NOW)
    expect([...sessions.publications.keys()]).toEqual(['a'])
  })

  it('leaves no publication while a manual answer waits', async () => {
    const [essay] = await start([
      { type: 'ESSAY', content: { guideHtml: null } },
    ])
    answer(essay, { text: 'jawaban' })

    const closed = await service.finalize('a', 'SUBMITTED', NOW)

    expect(closed.status).toBe('SUBMITTED')
    expect(closed.gradedAt).toBeNull()
    expect(sessions.publications.size).toBe(0)
  })
})
