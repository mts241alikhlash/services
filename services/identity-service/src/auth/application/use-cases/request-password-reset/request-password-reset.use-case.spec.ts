import { RequestPasswordResetUseCase } from './request-password-reset.use-case.js'

const CONFIG: Record<string, string> = {
  SSO_ACCOUNTS_ORIGIN: 'https://accounts.test',
  SSO_APPS:
    'account=https://accounts.test/oauth/callback,admission=https://ppdb.test/oauth/callback',
}

function build(nodeEnv: string, emailSent: boolean, roles: string[] = []) {
  const authRepository = {
    findUserByIdentifier: jest.fn().mockResolvedValue({
      id: 'user-1',
      identifier: 'guru@example.com',
      isActive: true,
      deletedAt: null,
      userRoles: roles.map((code) => ({ role: { code } })),
    }),
    createPasswordResetToken: jest.fn().mockResolvedValue(undefined),
  }
  const emailService = { sendEmail: jest.fn().mockResolvedValue(emailSent) }
  const configService = {
    get: jest.fn((key: string, fallback?: string) =>
      key === 'NODE_ENV' ? nodeEnv : fallback,
    ),
    getOrThrow: jest.fn((key: string) => CONFIG[key]),
  }
  const useCase = new RequestPasswordResetUseCase(
    authRepository as never,
    emailService as never,
    configService as never,
  )
  return { useCase, emailService }
}

function sentHtml(emailService: { sendEmail: jest.Mock }): string {
  return (emailService.sendEmail.mock.calls[0] as string[])[2]
}

describe('RequestPasswordResetUseCase', () => {
  it('never returns the reset token in production, even when the email fails', async () => {
    const result = await build('production', false).useCase.execute(
      'guru@example.com',
    )

    expect(result.success).toBe(true)
    expect(result.debugToken).toBeUndefined()
  })

  it('returns the token outside production so a developer can follow the link', async () => {
    const result = await build('development', true).useCase.execute(
      'guru@example.com',
    )

    expect(result.debugToken).toMatch(/^[0-9a-f]{64}$/)
  })

  it('sends staff to accounts to reset the password', async () => {
    const { useCase, emailService } = build('production', true, ['TEACHER'])

    await useCase.execute('guru')

    expect(sentHtml(emailService)).toContain(
      'https://accounts.test/reset-password?token=',
    )
  })

  it('sends an applicant to PPDB to reset the password', async () => {
    const { useCase, emailService } = build('production', true, ['APPLICANT'])

    await useCase.execute('calon')

    expect(sentHtml(emailService)).toContain(
      'https://ppdb.test/reset-password?token=',
    )
  })
})
