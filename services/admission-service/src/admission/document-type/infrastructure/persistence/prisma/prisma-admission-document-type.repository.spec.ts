import { PrismaAdmissionDocumentTypeRepository } from './prisma-admission-document-type.repository.js'

const row = {
  id: 't1',
  code: 'FAMILY_CARD',
  name: 'Kartu Keluarga',
  isRequired: true,
  isActive: true,
  sortOrder: 1,
  _count: { documents: 3 },
}

function makePrisma() {
  const prisma = {
    admissionDocumentType: {
      findMany: jest.fn().mockResolvedValue([row]),
      findUnique: jest.fn().mockResolvedValue(row),
      findFirst: jest.fn().mockResolvedValue(null),
      aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: null } }),
      create: jest.fn().mockResolvedValue(row),
      update: jest.fn().mockResolvedValue(row),
      delete: jest.fn().mockResolvedValue(row),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  }
  return prisma
}

describe('PrismaAdmissionDocumentTypeRepository', () => {
  it('lists by sortOrder with the upload count', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionDocumentTypeRepository(prisma as never)

    const result = await repo.findAll()

    expect(prisma.admissionDocumentType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    )
    expect(result).toEqual([
      {
        id: 't1',
        code: 'FAMILY_CARD',
        name: 'Kartu Keluarga',
        isRequired: true,
        isActive: true,
        sortOrder: 1,
        documentCount: 3,
      },
    ])
  })

  it('compares names case-insensitively, skipping the type itself', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionDocumentTypeRepository(prisma as never)

    await expect(repo.nameTaken('kartu keluarga', 't1')).resolves.toBe(false)

    expect(prisma.admissionDocumentType.findFirst).toHaveBeenCalledWith({
      where: {
        name: { equals: 'kartu keluarga', mode: 'insensitive' },
        NOT: { id: 't1' },
      },
      select: { id: true },
    })
  })

  it('starts the order at zero when there are no types', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionDocumentTypeRepository(prisma as never)

    await expect(repo.maxSortOrder()).resolves.toBe(0)
  })

  it('rewrites sortOrder 1..n in one transaction', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionDocumentTypeRepository(prisma as never)

    await repo.reorder(['t2', 't1'])

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(prisma.admissionDocumentType.update).toHaveBeenNthCalledWith(1, {
      where: { id: 't2' },
      data: { sortOrder: 1 },
    })
    expect(prisma.admissionDocumentType.update).toHaveBeenNthCalledWith(2, {
      where: { id: 't1' },
      data: { sortOrder: 2 },
    })
  })
})
