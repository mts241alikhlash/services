import 'reflect-metadata'
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InternalMediaGuard } from '../../../core/guards/internal-media.guard.js'
import { FakeExamSessionRepository } from '../../application/exam-session.repository.fake.js'
import { sessionFor } from '../../application/exam-session.test-support.js'
import { CheckStreamTokenUseCase } from '../../application/use-cases/check-stream-token/check-stream-token.use-case.js'
import { StreamAuthController } from './stream-auth.controller.js'

const SECRET = 'a'.repeat(48)
const config = {
  getOrThrow: () => SECRET,
  get: () => SECRET,
} as unknown as ConfigService

describe('StreamAuthController', () => {
  const jwt = new JwtService()

  function controllerWith(overrides: Record<string, unknown> = {}) {
    const sessions = new FakeExamSessionRepository()
    sessions.sessions.set(
      'sid',
      sessionFor({ id: 'schedule' } as never, {
        id: 'sid',
        status: 'IN_PROGRESS',
        streamNonce: 'n1',
        ...overrides,
      }),
    )
    return new StreamAuthController(
      new CheckStreamTokenUseCase(sessions, jwt, config),
    )
  }

  const sign = (claims: Record<string, unknown>) =>
    jwt.sign(claims, { secret: SECRET, expiresIn: 300 })

  const live = () => sign({ sub: 'sid', nonce: 'n1', kind: 'whip-publish' })

  it('answers 200 with an expiry for a live publish', async () => {
    const controller = controllerWith()

    const result = await controller.check({
      token: live(),
      path: 'sid',
      action: 'publish',
    })

    expect(result.expireAt).toBeDefined()
  })

  it('throws instead of answering 200 with a denial, which MediaMTX would read as allow', async () => {
    const controller = controllerWith({ status: 'SUBMITTED' })

    await expect(
      controller.check({ token: live(), path: 'sid', action: 'publish' }),
    ).rejects.toThrow(ForbiddenException)
  })

  it('denies a rotated nonce', async () => {
    const controller = controllerWith({ streamNonce: 'n2' })

    await expect(
      controller.check({ token: live(), path: 'sid', action: 'publish' }),
    ).rejects.toThrow(ForbiddenException)
  })

  it('reads the token out of the raw query when MediaMTX does not lift it', async () => {
    const controller = controllerWith()

    const result = await controller.check({
      query: `token=${encodeURIComponent(live())}`,
      path: 'sid',
      action: 'publish',
    })

    expect(result.expireAt).toBeDefined()
  })

  it('denies a request with no token at all', async () => {
    const controller = controllerWith()

    await expect(
      controller.check({ path: 'sid', action: 'publish' }),
    ).rejects.toThrow(ForbiddenException)
  })
})

describe('InternalMediaGuard', () => {
  const guard = new InternalMediaGuard()

  function contextWith(headers: Record<string, string>) {
    return {
      switchToHttp: () => ({ getRequest: () => ({ headers }) }),
    } as never
  }

  it('refuses anything that came through the public gateway', () => {
    expect(() =>
      guard.canActivate(contextWith({ 'x-forwarded-for': '203.0.113.1' })),
    ).toThrow(NotFoundException)
  })

  it('accepts a call from inside the network', () => {
    expect(guard.canActivate(contextWith({}))).toBe(true)
  })
})
