import { ConflictException } from '@nestjs/common'
import { Prisma } from '../../../../../generated/prisma/client.js'
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
    expect(prisma.admissionDocumentType.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          _count: { select: { documents: true } },
        }),
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

  function knownError(code: string) {
    return new Prisma.PrismaClientKnownRequestError('x', {
      code,
      clientVersion: 'test',
    })
  }

  it('answers 409 when a concurrent create produced the same code', async () => {
    const prisma = makePrisma()
    prisma.admissionDocumentType.create.mockRejectedValue(knownError('P2002'))
    const repo = new PrismaAdmissionDocumentTypeRepository(prisma as never)

    await expect(
      repo.create({
        name: 'Photo',
        code: 'PHOTO_2',
        isRequired: true,
        isActive: true,
        sortOrder: 8,
      }),
    ).rejects.toThrow(new ConflictException('Nama jenis berkas sudah ada'))
  })

  it('answers 409 when an upload landed before the delete', async () => {
    const prisma = makePrisma()
    prisma.admissionDocumentType.delete.mockRejectedValue(knownError('P2003'))
    const repo = new PrismaAdmissionDocumentTypeRepository(prisma as never)

    await expect(repo.delete('t1')).rejects.toThrow(
      new ConflictException('Jenis berkas sudah dipakai, nonaktifkan saja'),
    )
  })

  it('lets other database errors through', async () => {
    const prisma = makePrisma()
    const failure = knownError('P2025')
    prisma.admissionDocumentType.delete.mockRejectedValue(failure)
    const repo = new PrismaAdmissionDocumentTypeRepository(prisma as never)

    await expect(repo.delete('t1')).rejects.toBe(failure)
  })
})
