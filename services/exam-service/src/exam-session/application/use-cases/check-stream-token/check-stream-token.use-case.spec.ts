import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { FakeExamSessionRepository } from '../../exam-session.repository.fake.js'
import { sessionFor } from '../../exam-session.test-support.js'
import { CheckStreamTokenUseCase } from './check-stream-token.use-case.js'

const SECRET = 'a'.repeat(48)
const config = {
  getOrThrow: () => SECRET,
} as unknown as ConfigService
const NOW = new Date('2026-11-02T02:00:00.000Z')

describe('CheckStreamTokenUseCase', () => {
  const jwt = new JwtService()

  function sessionsWith(overrides: Record<string, unknown>) {
    const sessions = new FakeExamSessionRepository()
    sessions.sessions.set(
      'sid',
      sessionFor({ id: 'schedule' } as never, { id: 'sid', ...overrides }),
    )
    return sessions
  }

  const check = (sessions: FakeExamSessionRepository) =>
    new CheckStreamTokenUseCase(sessions, jwt, config)

  const sign = (claims: Record<string, unknown>) =>
    jwt.sign(claims, { secret: SECRET, expiresIn: 300 })

  const publish = (overrides: Record<string, unknown> = {}) =>
    sign({ sub: 'sid', nonce: 'n1', kind: 'whip-publish', ...overrides })

  describe('publish', () => {
    it('allows a live token and records the heartbeat', async () => {
      const sessions = sessionsWith({
        status: 'IN_PROGRESS',
        streamNonce: 'n1',
      })

      const result = await check(sessions).execute(
        publish(),
        'sid',
        'publish',
        NOW,
      )

      expect(result.allowed).toBe(true)
      expect(sessions.sessions.get('sid')?.lastSeenAt).toEqual(NOW)
    })

    it('bounds the session so an open publish is closed and re-checked', async () => {
      const sessions = sessionsWith({
        status: 'IN_PROGRESS',
        streamNonce: 'n1',
      })

      const result = await check(sessions).execute(
        publish(),
        'sid',
        'publish',
        NOW,
      )

      expect(result.allowed && result.expireAt).toEqual(
        new Date(NOW.getTime() + 60_000),
      )
    })

    it('rejects a token after the session was submitted', async () => {
      const sessions = sessionsWith({ status: 'SUBMITTED', streamNonce: 'n1' })

      expect(
        (await check(sessions).execute(publish(), 'sid', 'publish', NOW))
          .allowed,
      ).toBe(false)
    })

    it('rejects a token whose nonce was rotated away', async () => {
      const sessions = sessionsWith({
        status: 'IN_PROGRESS',
        streamNonce: 'n2',
      })

      expect(
        (await check(sessions).execute(publish(), 'sid', 'publish', NOW))
          .allowed,
      ).toBe(false)
    })

    it('rejects a token used on a different path', async () => {
      const sessions = sessionsWith({
        status: 'IN_PROGRESS',
        streamNonce: 'n1',
      })

      expect(
        (await check(sessions).execute(publish(), 'other', 'publish', NOW))
          .allowed,
      ).toBe(false)
    })

    it('rejects a token of another kind', async () => {
      const sessions = sessionsWith({
        status: 'IN_PROGRESS',
        streamNonce: 'n1',
      })

      expect(
        (
          await check(sessions).execute(
            publish({ kind: 'access' }),
            'sid',
            'publish',
            NOW,
          )
        ).allowed,
      ).toBe(false)
    })

    it('rejects a forged token', async () => {
      const sessions = sessionsWith({
        status: 'IN_PROGRESS',
        streamNonce: 'n1',
      })

      expect(
        (await check(sessions).execute('not-a-jwt', 'sid', 'publish', NOW))
          .allowed,
      ).toBe(false)
    })

    it('rejects an unknown action rather than defaulting to allow', async () => {
      const sessions = sessionsWith({
        status: 'IN_PROGRESS',
        streamNonce: 'n1',
      })

      expect(
        (await check(sessions).execute(publish(), 'sid', 'api', NOW)).allowed,
      ).toBe(false)
    })

    it('does not record a heartbeat for a rejected token', async () => {
      const sessions = sessionsWith({ status: 'SUBMITTED', streamNonce: 'n1' })

      await check(sessions).execute(publish(), 'sid', 'publish', NOW)

      expect(sessions.sessions.get('sid')?.lastSeenAt).toBeNull()
    })
  })

  describe('read', () => {
    it('allows an hls-read token for its own path', async () => {
      const sessions = sessionsWith({})

      const result = await check(sessions).execute(
        sign({ sub: 'schedule-1', kind: 'hls-read' }),
        'schedule-1',
        'read',
        NOW,
      )

      expect(result.allowed).toBe(true)
    })

    it('refuses a publish token on the read path', async () => {
      const sessions = sessionsWith({})

      expect(
        (
          await check(sessions).execute(
            sign({ sub: 'schedule-1', kind: 'whip-publish' }),
            'schedule-1',
            'read',
            NOW,
          )
        ).allowed,
      ).toBe(false)
    })

    it('refuses a read token naming another schedule', async () => {
      const sessions = sessionsWith({})

      expect(
        (
          await check(sessions).execute(
            sign({ sub: 'schedule-1', kind: 'hls-read' }),
            'schedule-2',
            'read',
            NOW,
          )
        ).allowed,
      ).toBe(false)
    })
  })
})
