import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { FakeExamSessionRepository } from '../../exam-session.repository.fake.js'
import { sessionFor } from '../../exam-session.test-support.js'
import { CheckStreamTokenUseCase } from './check-stream-token.use-case.js'

const SECRET = 'a'.repeat(48)
const config = {
  getOrThrow: () => SECRET,
} as unknown as ConfigService

describe('CheckStreamTokenUseCase', () => {
  const jwt = new JwtService()
  const useCase = new CheckStreamTokenUseCase(
    new FakeExamSessionRepository(),
    jwt,
    config,
  )

  function sessionsWith(overrides: Record<string, unknown>) {
    const sessions = new FakeExamSessionRepository()
    sessions.sessions.set(
      'sid',
      sessionFor({ id: 'schedule' } as never, { id: 'sid', ...overrides }),
    )
    return new CheckStreamTokenUseCase(sessions, jwt, config)
  }

  const sign = (claims: Record<string, unknown>) =>
    jwt.sign(claims, { secret: SECRET, expiresIn: 300 })

  it('accepts a live token and records the heartbeat', async () => {
    const sessions = new FakeExamSessionRepository()
    sessions.sessions.set(
      'sid',
      sessionFor({ id: 'schedule' } as never, {
        id: 'sid',
        status: 'IN_PROGRESS',
        streamNonce: 'n1',
      }),
    )
    const check = new CheckStreamTokenUseCase(sessions, jwt, config)

    expect(
      await check.execute(
        sign({ sub: 'sid', nonce: 'n1', kind: 'whip-publish' }),
        'sid',
      ),
    ).toBe(true)
    expect(sessions.sessions.get('sid')?.lastSeenAt).not.toBeNull()
  })

  it('rejects a token after the session was submitted', async () => {
    const check = sessionsWith({ status: 'SUBMITTED', streamNonce: 'n1' })

    expect(
      await check.execute(
        sign({ sub: 'sid', nonce: 'n1', kind: 'whip-publish' }),
        'sid',
      ),
    ).toBe(false)
  })

  it('rejects a token whose nonce was rotated away', async () => {
    const check = sessionsWith({ status: 'IN_PROGRESS', streamNonce: 'n2' })

    expect(
      await check.execute(
        sign({ sub: 'sid', nonce: 'n1', kind: 'whip-publish' }),
        'sid',
      ),
    ).toBe(false)
  })

  it('rejects a token used on a different path', async () => {
    const check = sessionsWith({ status: 'IN_PROGRESS', streamNonce: 'n1' })

    expect(
      await check.execute(
        sign({ sub: 'sid', nonce: 'n1', kind: 'whip-publish' }),
        'other',
      ),
    ).toBe(false)
  })

  it('rejects a token of another kind', async () => {
    const check = sessionsWith({ status: 'IN_PROGRESS', streamNonce: 'n1' })

    expect(
      await check.execute(
        sign({ sub: 'sid', nonce: 'n1', kind: 'access' }),
        'sid',
      ),
    ).toBe(false)
  })

  it('rejects a forged token', async () => {
    const check = sessionsWith({ status: 'IN_PROGRESS', streamNonce: 'n1' })

    expect(await check.execute('not-a-jwt', 'sid')).toBe(false)
  })

  it('does not record a heartbeat for a rejected token', async () => {
    const sessions = new FakeExamSessionRepository()
    sessions.sessions.set(
      'sid',
      sessionFor({ id: 'schedule' } as never, {
        id: 'sid',
        status: 'SUBMITTED',
        streamNonce: 'n1',
      }),
    )
    const check = new CheckStreamTokenUseCase(sessions, jwt, config)

    await check.execute(
      sign({ sub: 'sid', nonce: 'n1', kind: 'whip-publish' }),
      'sid',
    )

    expect(sessions.sessions.get('sid')?.lastSeenAt).toBeNull()
  })
})
