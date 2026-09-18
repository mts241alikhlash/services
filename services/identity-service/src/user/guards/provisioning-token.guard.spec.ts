import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ProvisioningTokenGuard } from './provisioning-token.guard.js'

describe('ProvisioningTokenGuard', () => {
  const config = { get: jest.fn() } as unknown as ConfigService
  const guard = new ProvisioningTokenGuard(config)

  function contextWithHeader(value: string | undefined): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-provisioning-token': value } }),
      }),
    } as unknown as ExecutionContext
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(config.get as jest.Mock).mockReturnValue('the-shared-secret')
  })

  it('admits a request whose header matches the configured token', () => {
    expect(guard.canActivate(contextWithHeader('the-shared-secret'))).toBe(true)
  })

  it('rejects a request with no header', () => {
    expect(() => guard.canActivate(contextWithHeader(undefined))).toThrow(
      UnauthorizedException,
    )
  })

  it('rejects a request whose header does not match', () => {
    expect(() => guard.canActivate(contextWithHeader('wrong'))).toThrow(
      UnauthorizedException,
    )
  })

  it('rejects every request when no token is configured', () => {
    ;(config.get as jest.Mock).mockReturnValue(undefined)

    expect(() => guard.canActivate(contextWithHeader('anything'))).toThrow(
      UnauthorizedException,
    )
  })
})
