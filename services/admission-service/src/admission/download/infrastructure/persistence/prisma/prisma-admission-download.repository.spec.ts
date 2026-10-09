import { PrismaAdmissionDownloadRepository } from './prisma-admission-download.repository.js'

const row = {
  id: 'd1',
  title: 'Brosur PPDB',
  description: null,
  fileKey: 'admission-downloads/a.pdf',
  fileName: 'brosur.pdf',
  sizeBytes: 20,
  sortOrder: 1,
  isActive: true,
  createdAt: new Date('2026-10-09T00:00:00Z'),
  updatedAt: new Date('2026-10-09T00:00:00Z'),
}

function makePrisma() {
  return {
    admissionDownload: {
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
}

describe('PrismaAdmissionDownloadRepository', () => {
  it('lists every row by sortOrder', async () => {
    const prisma = makePrisma()
    const result = await new PrismaAdmissionDownloadRepository(
      prisma as never,
    ).findAll()

    expect(prisma.admissionDownload.findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    })
    expect(result).toEqual([row])
  })

  it('lists only active rows for visitors', async () => {
    const prisma = makePrisma()
    await new PrismaAdmissionDownloadRepository(prisma as never).findActive()

    expect(prisma.admissionDownload.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    })
  })

  it('finds one by id', async () => {
    const prisma = makePrisma()
    await expect(
      new PrismaAdmissionDownloadRepository(prisma as never).findById('d1'),
    ).resolves.toEqual(row)
    expect(prisma.admissionDownload.findUnique).toHaveBeenCalledWith({
      where: { id: 'd1' },
    })
  })

  it('compares titles without case and skips the row being edited', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionDownloadRepository(prisma as never)

    await expect(repo.titleTaken('Brosur')).resolves.toBe(false)
    expect(prisma.admissionDownload.findFirst).toHaveBeenLastCalledWith({
      where: { title: { equals: 'Brosur', mode: 'insensitive' } },
      select: { id: true },
    })

    prisma.admissionDownload.findFirst.mockResolvedValue({ id: 'x' })
    await expect(repo.titleTaken('Brosur', 'd1')).resolves.toBe(true)
    expect(prisma.admissionDownload.findFirst).toHaveBeenLastCalledWith({
      where: {
        title: { equals: 'Brosur', mode: 'insensitive' },
        NOT: { id: 'd1' },
      },
      select: { id: true },
    })
  })

  it('reports 0 as the highest order of an empty table', async () => {
    const prisma = makePrisma()
    await expect(
      new PrismaAdmissionDownloadRepository(prisma as never).maxSortOrder(),
    ).resolves.toBe(0)
    prisma.admissionDownload.aggregate.mockResolvedValue({
      _max: { sortOrder: 6 },
    })
    await expect(
      new PrismaAdmissionDownloadRepository(prisma as never).maxSortOrder(),
    ).resolves.toBe(6)
  })

  it('creates and updates with the given fields', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionDownloadRepository(prisma as never)
    const record = {
      title: 'Brosur PPDB',
      description: null,
      fileKey: 'admission-downloads/a.pdf',
      fileName: 'brosur.pdf',
      sizeBytes: 20,
      sortOrder: 1,
      isActive: true,
    }

    await repo.create(record)
    expect(prisma.admissionDownload.create).toHaveBeenCalledWith({
      data: record,
    })

    await repo.update('d1', { title: 'Baru' })
    expect(prisma.admissionDownload.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { title: 'Baru' },
    })
  })

  it('rewrites the order as 1..n in one transaction', async () => {
    const prisma = makePrisma()
    await new PrismaAdmissionDownloadRepository(prisma as never).reorder([
      'b',
      'a',
    ])

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(prisma.admissionDownload.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'b' },
      data: { sortOrder: 1 },
    })
    expect(prisma.admissionDownload.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'a' },
      data: { sortOrder: 2 },
    })
  })

  it('deletes a row', async () => {
    const prisma = makePrisma()
    await new PrismaAdmissionDownloadRepository(prisma as never).delete('d1')
    expect(prisma.admissionDownload.delete).toHaveBeenCalledWith({
      where: { id: 'd1' },
    })
  })
})
