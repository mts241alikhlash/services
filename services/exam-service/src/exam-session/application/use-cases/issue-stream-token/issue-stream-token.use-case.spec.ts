import { ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
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
import { IssueStreamTokenUseCase } from './issue-stream-token.use-case.js'

const config = {
  getOrThrow: (key: string) =>
    key === 'JWT_SECRET' ? 'a'.repeat(48) : 'https://stream.test',
  get: (key: string, fallback?: string) =>
    key === 'STREAM_RTMP_URL' ? 'rtmps://stream.test:1936' : fallback,
} as unknown as ConfigService

describe('IssueStreamTokenUseCase', () => {
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
      useCase: new IssueStreamTokenUseCase(
        new SessionAccessService(sessions, finalizer),
        sessions,
        new JwtService(),
        config,
      ),
    }
  }

  it('refuses a session that is not in progress', async () => {
    const { useCase } = await setup({ status: 'SUBMITTED' })

    await expect(useCase.execute(STUDENT_USER, 'a', NOW)).rejects.toThrow(
      ConflictException,
    )
  })

  it('rotates the nonce on every call', async () => {
    const { useCase, sessions } = await setup()

    await useCase.execute(STUDENT_USER, 'a', NOW)
    const first = sessions.sessions.get('a')?.streamNonce
    await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(first).toBeTruthy()
    expect(sessions.sessions.get('a')?.streamNonce).not.toEqual(first)
  })

  it('expires at the earlier of the deadline and five minutes', async () => {
    const deadline = new Date(NOW.getTime() + 60_000)
    const { useCase } = await setup({ deadline })

    const result = await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(result.expiresAt).toEqual(deadline)
  })

  it('never expires later than five minutes from now', async () => {
    const { useCase } = await setup({
      deadline: new Date(NOW.getTime() + 60 * 60 * 1000),
    })

    const result = await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(result.expiresAt).toEqual(new Date(NOW.getTime() + 5 * 60 * 1000))
  })

  it('returns a publish url carrying the session and a token', async () => {
    const { useCase } = await setup()

    const result = await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(result.publishUrl).toMatch(
      /^rtmps:\/\/stream\.test:1936\/a\?token=/,
    )
    expect(result.heartbeatSeconds).toBe(20)
  })

  it('records the heartbeat when it issues a token', async () => {
    const { useCase, sessions } = await setup()

    await useCase.execute(STUDENT_USER, 'a', NOW)

    expect(sessions.sessions.get('a')?.lastSeenAt).toEqual(NOW)
  })
})
