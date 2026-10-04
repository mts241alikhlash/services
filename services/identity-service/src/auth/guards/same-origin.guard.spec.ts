import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SameOriginGuard } from './same-origin.guard.js'

function contextWith(headers: Record<string, string | undefined>) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext
}

function guardIn(nodeEnv: string) {
  return new SameOriginGuard(
    new ConfigService({
      NODE_ENV: nodeEnv,
      FRONTEND_URL: 'http://localhost:5173,http://localhost:5177',
      SSO_ACCOUNTS_ORIGIN: 'http://localhost:5180',
    }),
  )
}

describe('SameOriginGuard', () => {
  it('admits a page calling its own host in production', () => {
    expect(
      guardIn('production').canActivate(
        contextWith({
          origin: 'https://hr.example.sch.id',
          host: 'hr.example.sch.id',
        }),
      ),
    ).toBe(true)
  })

  it("refuses another app's page in production", () => {
    expect(() =>
      guardIn('production').canActivate(
        contextWith({
          origin: 'https://admission.example.sch.id',
          host: 'hr.example.sch.id',
        }),
      ),
    ).toThrow(ForbiddenException)
  })

  it('refuses a request without an Origin header', () => {
    expect(() =>
      guardIn('production').canActivate(
        contextWith({ host: 'hr.example.sch.id' }),
      ),
    ).toThrow(ForbiddenException)
  })

  it('refuses plain http in production', () => {
    expect(() =>
      guardIn('production').canActivate(
        contextWith({
          origin: 'http://hr.example.sch.id',
          host: 'hr.example.sch.id',
        }),
      ),
    ).toThrow(ForbiddenException)
  })

  it('admits a listed dev origin behind the Vite proxy', () => {
    expect(
      guardIn('development').canActivate(
        contextWith({
          origin: 'http://localhost:5177',
          host: 'localhost:3000',
        }),
      ),
    ).toBe(true)
  })

  it('admits the accounts dev origin', () => {
    expect(
      guardIn('development').canActivate(
        contextWith({
          origin: 'http://localhost:5180',
          host: 'localhost:3000',
        }),
      ),
    ).toBe(true)
  })

  it('refuses an unlisted dev origin', () => {
    expect(() =>
      guardIn('development').canActivate(
        contextWith({ origin: 'http://evil.test', host: 'localhost:3000' }),
      ),
    ).toThrow(ForbiddenException)
  })
})
