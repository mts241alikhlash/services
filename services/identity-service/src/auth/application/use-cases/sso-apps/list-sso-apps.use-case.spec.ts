import { ConfigService } from '@nestjs/config'
import { IAuthRepository } from '../../../domain/repositories/auth.repository.js'
import { ListSsoAppsUseCase } from './list-sso-apps.use-case.js'

describe('ListSsoAppsUseCase', () => {
  const repository = { findGrants: jest.fn() }
  const useCase = new ListSsoAppsUseCase(
    repository as unknown as IAuthRepository,
    new ConfigService({
      SSO_APPS:
        'account=https://accounts.test/oauth/callback,hr=https://hr.test/oauth/callback,academic=https://academic.test/oauth/callback',
    }),
  )

  it('lists the apps the person may open, without account', async () => {
    repository.findGrants.mockResolvedValue({
      roles: ['STAFF'],
      permissions: ['presence-scans.read'],
    })

    await expect(useCase.execute('u1')).resolves.toEqual([
      { key: 'hr', label: 'Kepegawaian', url: 'https://hr.test' },
    ])
  })

  it('lists nothing for an applicant', async () => {
    repository.findGrants.mockResolvedValue({
      roles: ['APPLICANT'],
      permissions: ['admissions.read'],
    })

    await expect(useCase.execute('u2')).resolves.toEqual([])
  })
})
