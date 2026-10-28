import { BadRequestException, ConflictException } from '@nestjs/common'
import { FakeExamPackageRepository } from '../../../../exam-package/application/exam-package.repository.fake.js'
import { FakeExamScheduleRepository } from '../../../../exam-schedule/application/exam-schedule.repository.fake.js'
import { FakeQuestionRepository } from '../../../../question/application/question.repository.fake.js'
import type { ExamSchedule } from '../../../../exam-schedule/domain/entities/exam-schedule.entity.js'
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
import { SaveAnswerUseCase } from './save-answer.use-case.js'

describe('SaveAnswerUseCase', () => {
  let packages: FakeExamPackageRepository
  let schedules: FakeExamScheduleRepository
  let questions: FakeQuestionRepository
  let sessions: FakeExamSessionRepository
  let useCase: SaveAnswerUseCase
  let schedule: ExamSchedule
  let questionId: string
  let otherQuestionId: string

  beforeEach(async () => {
    packages = new FakeExamPackageRepository()
    schedules = new FakeExamScheduleRepository(packages)
    questions = new FakeQuestionRepository()
    sessions = new FakeExamSessionRepository()
    const paper = await schedulePaper({ packages, schedules, questions }, [
      choiceSpec('B'),
      choiceSpec('C'),
    ])
    schedule = paper.schedule
    questionId = paper.questionIds[0]
    otherQuestionId = paper.questionIds[1]
    sessions.sessions.set('a', sessionFor(schedule, { id: 'a' }))
    useCase = new SaveAnswerUseCase(
      new SessionAccessService(sessions, new FakeSessionFinalizer()),
      schedules,
      packages,
      questions,
      sessions,
    )
  })

  const save = (
    overrides: Partial<{
      questionId: string
      clientId: string
      answer: Record<string, unknown>
    }> = {},
    now: Date = NOW,
  ) =>
    useCase.execute(
      STUDENT_USER,
      'a',
      {
        questionId,
        clientId: 'c1',
        answer: { key: 'A' },
        ...overrides,
      },
      now,
    )

  it('saves and updates an answer', async () => {
    await save()
    const updated = await save({ clientId: 'c2', answer: { key: 'D' } })

    expect(updated).toMatchObject({
      questionId,
      clientId: 'c2',
      receivedAfterDeadline: false,
    })
    expect(sessions.answers.size).toBe(1)
    expect([...sessions.answers.values()][0].answer).toEqual({ key: 'D' })
  })

  it('replays the same client id without changing anything', async () => {
    await save()
    const stored = [...sessions.answers.values()][0]

    const replay = await save(
      { answer: { key: 'E' } },
      new Date(NOW.getTime() + 5000),
    )

    expect(replay.clientId).toBe('c1')
    expect([...sessions.answers.values()][0]).toEqual(stored)
  })

  it('rejects a question outside the package', async () => {
    await expect(
      save({ questionId: '99999999-9999-4999-8999-999999999999' }),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects a shape that does not fit the type', async () => {
    await expect(save({ answer: { keys: ['A'] } })).rejects.toThrow(
      'Bentuk jawaban tidak sesuai dengan jenis soal',
    )
    expect(sessions.answers.size).toBe(0)
  })

  it('accepts and flags an answer after the deadline', async () => {
    const result = await save({}, new Date('2026-11-02T03:35:00.000Z'))

    expect(result.receivedAfterDeadline).toBe(true)
  })

  it('rejects an answer after finalizeAt', async () => {
    await expect(
      save({}, new Date('2026-11-02T03:40:00.000Z')),
    ).rejects.toThrow('Waktu pengiriman jawaban sudah habis')
  })

  it('rejects an answer for a submitted session', async () => {
    sessions.sessions.set(
      'a',
      sessionFor(schedule, { id: 'a', status: 'SUBMITTED' }),
    )

    await expect(save()).rejects.toThrow(ConflictException)
  })

  it('refuses a client id that already belongs to another question', async () => {
    await save()

    await expect(
      save({ questionId: otherQuestionId, answer: { key: 'A' } }),
    ).rejects.toThrow('Client id sudah dipakai untuk soal lain')
    expect(sessions.answers.size).toBe(1)
  })

  it('refuses when the session closed between the check and the write', async () => {
    jest.spyOn(sessions, 'upsertAnswer').mockResolvedValueOnce(null)

    await expect(save()).rejects.toThrow('Waktu pengiriman jawaban sudah habis')
  })

  it('refuses a device the session is not bound to', async () => {
    await expect(
      useCase.execute(
        { ...STUDENT_USER, deviceId: 'device-2' },
        'a',
        { questionId, clientId: 'c9', answer: { key: 'A' } },
        NOW,
      ),
    ).rejects.toThrow(ConflictException)
  })
})
