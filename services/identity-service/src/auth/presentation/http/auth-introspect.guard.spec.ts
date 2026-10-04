import { GUARDS_METADATA } from '@nestjs/common/constants'
import { ProvisioningTokenGuard } from '../../../user/guards/provisioning-token.guard.js'
import { AuthController } from './auth.controller.js'

describe('POST /auth/introspect', () => {
  const handler = AuthController.prototype.introspect

  it('answers only services that hold the provisioning token', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(
      ProvisioningTokenGuard,
    )
  })

  it('is never rate limited, since every caller is a service sharing one address', () => {
    expect(Reflect.getMetadata('THROTTLER:SKIPdefault', handler)).toBe(true)
    expect(Reflect.getMetadata('THROTTLER:SKIPauth', handler)).toBe(true)
  })
})
