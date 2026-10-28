import { PrismaAuthRepository } from './prisma-auth.repository.js'

describe('PrismaAuthRepository.updateSessionToken', () => {
  it('stores the replaced token hash and when it was replaced next to the new one', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 })
    const repository = new PrismaAuthRepository({
      authSession: { updateMany },
    } as never)
    const now = new Date('2026-10-07T09:00:00.000Z')
    const expiresAt = new Date('2026-10-14T09:00:00.000Z')

    const rotated = await repository.updateSessionToken('s1', 'old-hash', {
      tokenHash: 'new-hash',
      previousTokenHash: 'old-hash',
      previousRotatedAt: now,
      lastUsedAt: now,
      expiresAt,
    })

    expect(rotated).toBe(true)
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 's1', tokenHash: 'old-hash' },
      data: {
        tokenHash: 'new-hash',
        previousTokenHash: 'old-hash',
        previousRotatedAt: now,
        lastUsedAt: now,
        expiresAt,
      },
    })
  })

  it('returns false when another refresh rotated first', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 })
    const repository = new PrismaAuthRepository({
      authSession: { updateMany },
    } as never)
    const now = new Date('2026-10-07T09:00:00.000Z')

    const rotated = await repository.updateSessionToken('s1', 'old-hash', {
      tokenHash: 'new-hash',
      previousTokenHash: 'old-hash',
      previousRotatedAt: now,
      lastUsedAt: now,
      expiresAt: now,
    })

    expect(rotated).toBe(false)
  })
})
