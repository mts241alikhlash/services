import { ForbiddenException } from '@nestjs/common'
import { CentralSessionService } from '../../services/central-session.service.js'
import { CredentialsService } from '../../services/credentials.service.js'
import { SsoLoginUseCase } from './sso-login.use-case.js'

describe('SsoLoginUseCase', () => {
  const credentials = { verify: jest.fn() }
  const sessions = {
    open: jest.fn().mockResolvedValue({ token: 't', maxAgeMs: 1 }),
  }
  const useCase = new SsoLoginUseCase(
    credentials as unknown as CredentialsService,
    sessions as unknown as CentralSessionService,
  )

  beforeEach(() => jest.clearAllMocks())

  it('opens a central session for staff', async () => {
    credentials.verify.mockResolvedValue({
      id: 'u1',
      userRoles: [{ role: { code: 'TEACHER' } }],
    })

    await expect(
      useCase.execute({ identifier: 'guru', password: 'x' }, 'ua', '1.2.3.4'),
    ).resolves.toEqual({ token: 't', maxAgeMs: 1 })
    expect(sessions.open).toHaveBeenCalledWith('u1', 'ua', '1.2.3.4')
  })

  it('sends an applicant to PPDB', async () => {
    credentials.verify.mockResolvedValue({
      id: 'u2',
      userRoles: [{ role: { code: 'APPLICANT' } }],
    })

    await expect(
      useCase.execute({ identifier: 'calon', password: 'x' }),
    ).rejects.toThrow(new ForbiddenException('Pendaftar masuk lewat PPDB'))
    expect(sessions.open).not.toHaveBeenCalled()
  })
})
