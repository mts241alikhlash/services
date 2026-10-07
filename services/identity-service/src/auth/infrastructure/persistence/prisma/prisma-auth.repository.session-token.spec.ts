import { PrismaAuthRepository } from './prisma-auth.repository.js'

describe('PrismaAuthRepository.updateSessionToken', () => {
  it('stores the replaced token hash and when it was replaced next to the new one', async () => {
    const update = jest.fn().mockResolvedValue({ id: 's1' })
    const repository = new PrismaAuthRepository({
      authSession: { update },
    } as never)
    const now = new Date('2026-10-07T09:00:00.000Z')
    const expiresAt = new Date('2026-10-14T09:00:00.000Z')

    await repository.updateSessionToken('s1', {
      tokenHash: 'new-hash',
      previousTokenHash: 'old-hash',
      previousRotatedAt: now,
      lastUsedAt: now,
      expiresAt,
    })

    expect(update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: {
        tokenHash: 'new-hash',
        previousTokenHash: 'old-hash',
        previousRotatedAt: now,
        lastUsedAt: now,
        expiresAt,
      },
    })
  })
})
