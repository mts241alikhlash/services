import { Prisma } from '../../../../../generated/prisma/client.js'
import { PrismaLandingRepository } from './prisma-landing.repository.js'

const USER = '11111111-1111-4111-8111-111111111111'

function makePrisma() {
  const tx = {
    admissionLandingSection: {
      findMany: jest.fn().mockResolvedValue([
        {
          key: 'closing',
          draft: { a: 1 },
          draftUpdatedAt: new Date('2026-10-09T01:00:00Z'),
        },
        {
          key: 'faq',
          draft: { b: 2 },
          draftUpdatedAt: new Date('2026-10-09T02:00:00Z'),
        },
      ]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  }
  return {
    tx,
    admissionLandingSection: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    admissionLandingImage: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'i1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)),
  }
}

describe('PrismaLandingRepository', () => {
  it('lists every section row', async () => {
    const prisma = makePrisma()
    await new PrismaLandingRepository(prisma as never).findAllSections()
    expect(prisma.admissionLandingSection.findMany).toHaveBeenCalledTimes(1)
  })

  it('upserts a draft with its author and time, never touching published', async () => {
    const prisma = makePrisma()
    await new PrismaLandingRepository(prisma as never).saveDraft(
      'closing',
      { a: 1 },
      USER,
    )

    const call = prisma.admissionLandingSection.upsert.mock.calls[0][0] as {
      where: { key: string }
      create: Record<string, unknown>
      update: Record<string, unknown>
    }
    expect(call.where).toEqual({ key: 'closing' })
    expect(call.update).toEqual({
      draft: { a: 1 },
      draftUpdatedAt: expect.any(Date),
      draftUpdatedById: USER,
    })
    expect(call.update).not.toHaveProperty('published')
    expect(call.create).toMatchObject({
      key: 'closing',
      draft: { a: 1 },
      draftUpdatedById: USER,
    })
  })

  it('publishes every draft inside one transaction and reports the count', async () => {
    const prisma = makePrisma()

    const count = await new PrismaLandingRepository(prisma as never).publishAll(
      USER,
    )

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(count).toBe(2)
    expect(prisma.tx.admissionLandingSection.findMany).toHaveBeenCalledWith({
      where: { NOT: { draft: { equals: Prisma.DbNull } } },
    })
    expect(
      prisma.tx.admissionLandingSection.updateMany,
    ).toHaveBeenNthCalledWith(1, {
      where: {
        key: 'closing',
        draftUpdatedAt: new Date('2026-10-09T01:00:00Z'),
      },
      data: {
        published: { a: 1 },
        draft: Prisma.DbNull,
        publishedAt: expect.any(Date),
        publishedById: USER,
      },
    })
  })

  it('leaves a draft that was saved while publishing and counts only what it published', async () => {
    const prisma = makePrisma()
    prisma.tx.admissionLandingSection.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })

    const count = await new PrismaLandingRepository(prisma as never).publishAll(
      USER,
    )

    expect(count).toBe(1)
  })

  it('clears every draft on discard', async () => {
    const prisma = makePrisma()
    await new PrismaLandingRepository(prisma as never).discardAll()
    expect(prisma.admissionLandingSection.updateMany).toHaveBeenCalledWith({
      data: {
        draft: Prisma.DbNull,
        draftUpdatedAt: null,
        draftUpdatedById: null,
      },
    })
  })

  it('creates, finds and deletes images', async () => {
    const prisma = makePrisma()
    const repo = new PrismaLandingRepository(prisma as never)
    const input = {
      fileKey: 'admission-landing/a.webp',
      width: 1,
      height: 2,
      sizeBytes: 3,
      createdById: USER,
    }

    await repo.createImage(input)
    expect(prisma.admissionLandingImage.create).toHaveBeenCalledWith({
      data: input,
    })

    await repo.findImage('i1')
    expect(prisma.admissionLandingImage.findUnique).toHaveBeenCalledWith({
      where: { id: 'i1' },
    })

    await repo.findImagesByIds(['i1', 'i2'])
    expect(prisma.admissionLandingImage.findMany).toHaveBeenLastCalledWith({
      where: { id: { in: ['i1', 'i2'] } },
    })

    prisma.admissionLandingImage.findMany.mockResolvedValue([{ id: 'i1' }])
    await expect(repo.deleteImages(['i1'])).resolves.toEqual([{ id: 'i1' }])
    expect(prisma.admissionLandingImage.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['i1'] } },
    })
  })
})
