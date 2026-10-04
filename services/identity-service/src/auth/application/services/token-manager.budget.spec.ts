import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { TokenManagerService } from './token-manager.service.js'
import { TOKEN_PERMISSION_BUDGET_BYTES } from '../../types/jwt-token-payload.type.js'

describe('TokenManagerService: the permission budget', () => {
  const config = {
    getOrThrow: () => 'a-test-secret-of-at-least-32-characters',
    get: (_key: string, fallback: string) => fallback,
  } as unknown as ConfigService

  const signed: Record<string, unknown>[] = []
  const jwt = {
    signAsync: (payload: Record<string, unknown>) => {
      signed.push(payload)
      return Promise.resolve('token')
    },
  } as unknown as JwtService

  const service = new TokenManagerService(config, jwt)
  const user = { id: 'u1', identifier: 'guru' }

  beforeEach(() => {
    signed.length = 0
  })

  function permissionsOfSize(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `module-${i}.action-name`)
  }

  it('carries a teacher-sized list on the access token', async () => {
    const permissions = permissionsOfSize(30)
    await service.generateTokenPair(user, 's1', {
      roles: ['TEACHER'],
      permissions,
    })

    const access = signed.find((p) => p.type === 'access')
    expect(access?.roles).toEqual(['TEACHER'])
    expect(access?.permissions).toEqual(permissions)
  })

  it('drops a list that would not fit, keeping the roles', async () => {
    const permissions = permissionsOfSize(400)
    expect(
      Buffer.byteLength(JSON.stringify(permissions), 'utf8'),
    ).toBeGreaterThan(TOKEN_PERMISSION_BUDGET_BYTES)

    await service.generateTokenPair(user, 's1', {
      roles: ['SUPER_ADMIN'],
      permissions,
    })

    const access = signed.find((p) => p.type === 'access')
    expect(access?.permissions).toBeUndefined()
    expect(access?.roles).toEqual(['SUPER_ADMIN'])
  })

  it('never puts grants on the refresh token', async () => {
    await service.generateTokenPair(user, 's1', {
      roles: ['TEACHER'],
      permissions: permissionsOfSize(5),
    })

    const refresh = signed.find((p) => p.type === 'refresh')
    expect(refresh?.roles).toBeUndefined()
    expect(refresh?.permissions).toBeUndefined()
  })
})
