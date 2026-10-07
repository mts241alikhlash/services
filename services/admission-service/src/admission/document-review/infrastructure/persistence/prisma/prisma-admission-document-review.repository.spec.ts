import { PrismaAdmissionDocumentReviewRepository } from './prisma-admission-document-review.repository.js'

const approved = (documentTypeId: string) => ({
  documents: { some: { documentTypeId, status: 'APPROVED' } },
})

function queueRepository(counts = [3, 2, 7]) {
  const findMany = jest.fn().mockResolvedValue([])
  const count = jest.fn()
  counts.forEach((value) => count.mockResolvedValueOnce(value))
  count.mockResolvedValue(0)
  const prisma = {
    admissionDocumentType: {
      findMany: jest.fn().mockResolvedValue([{ id: 'kk' }, { id: 'akta' }]),
    },
    admissionApplication: { findMany, count },
  }
  return {
    repository: new PrismaAdmissionDocumentReviewRepository(prisma as never),
    prisma,
    findMany,
    count,
  }
}

const scope = { deletedAt: null }

describe('PrismaAdmissionDocumentReviewRepository.findQueue', () => {
  it('puts a submitted application with an unapproved required document in Menunggu', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({ tab: 'waiting', page: 1, limit: 20 })

    const call = findMany.mock.calls[0][0] as {
      where: unknown
      orderBy: unknown
    }
    expect(call.where).toEqual({
      AND: [
        scope,
        {
          status: 'SUBMITTED',
          OR: [{ NOT: approved('kk') }, { NOT: approved('akta') }],
        },
      ],
    })
    expect(call.orderBy).toEqual([{ submittedAt: 'asc' }, { id: 'asc' }])
  })

  it('puts a REVISION_NEEDED application in Perlu perbaikan, newest first', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({ tab: 'revision', page: 1, limit: 20 })

    const call = findMany.mock.calls[0][0] as {
      where: unknown
      orderBy: unknown
    }
    expect(call.where).toEqual({
      AND: [scope, { status: 'REVISION_NEEDED' }],
    })
    expect(call.orderBy).toEqual([{ updatedAt: 'desc' }, { id: 'asc' }])
  })

  it('puts fully approved submitted applications and every later status in Selesai', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({ tab: 'done', page: 1, limit: 20 })

    const call = findMany.mock.calls[0][0] as { where: unknown }
    expect(call.where).toEqual({
      AND: [
        scope,
        {
          OR: [
            {
              status: 'SUBMITTED',
              AND: [approved('kk'), approved('akta')],
            },
            {
              status: {
                in: [
                  'VERIFIED',
                  'ACCEPTED',
                  'ENROLLING',
                  'REJECTED',
                  'ENROLLED',
                ],
              },
            },
          ],
        },
      ],
    })
  })

  it('has nothing waiting and everything submitted done when no document is required', async () => {
    const { repository, prisma, findMany } = queueRepository()
    prisma.admissionDocumentType.findMany.mockResolvedValue([])

    await repository.findQueue({ tab: 'waiting', page: 1, limit: 20 })
    await repository.findQueue({ tab: 'done', page: 1, limit: 20 })

    const waiting = findMany.mock.calls[0][0] as { where: unknown }
    const done = findMany.mock.calls[1][0] as { where: unknown }
    expect(waiting.where).toEqual({
      AND: [scope, { status: 'SUBMITTED', OR: [] }],
    })
    expect(JSON.stringify(done.where)).toContain('"AND":[]')
  })

  it('filters by wave and a literal search, and never lists a draft', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({
      tab: 'revision',
      search: ' 100%_a\\b ',
      waveId: 'w1',
      page: 1,
      limit: 20,
    })

    const call = findMany.mock.calls[0][0] as { where: { AND: unknown[] } }
    expect(call.where.AND[0]).toEqual({
      deletedAt: null,
      waveId: 'w1',
      OR: [
        { fullName: { contains: '100\\%\\_a\\\\b', mode: 'insensitive' } },
        {
          registrationNumber: {
            contains: '100\\%\\_a\\\\b',
            mode: 'insensitive',
          },
        },
      ],
    })
    expect(JSON.stringify(call.where)).not.toContain('DRAFT')
  })

  it('pages the rows and counts all three tabs within the same scope', async () => {
    const { repository, findMany, count } = queueRepository([5, 3, 2, 9])
    findMany.mockResolvedValue([
      {
        id: 'app1',
        registrationNumber: 'PPDB-001',
        fullName: 'Ahmad',
        status: 'SUBMITTED',
        submittedAt: new Date('2026-10-01T00:00:00Z'),
        wave: { name: 'Gelombang 1' },
        documents: [{ documentTypeId: 'kk', status: 'APPROVED' }],
      },
    ])

    const result = await repository.findQueue({
      tab: 'waiting',
      page: 3,
      limit: 20,
    })

    expect(findMany.mock.calls[0][0]).toMatchObject({ skip: 40, take: 20 })
    expect(count).toHaveBeenCalledTimes(4)
    expect(result).toEqual({
      records: [
        {
          applicationId: 'app1',
          registrationNumber: 'PPDB-001',
          applicantName: 'Ahmad',
          waveName: 'Gelombang 1',
          status: 'SUBMITTED',
          submittedAt: new Date('2026-10-01T00:00:00Z'),
          documents: [{ documentTypeId: 'kk', status: 'APPROVED' }],
        },
      ],
      total: 5,
      counts: { waiting: 3, revision: 2, done: 9 },
      requiredTypeIds: ['kk', 'akta'],
    })
  })
})

describe('PrismaAdmissionDocumentReviewRepository.findContext', () => {
  it('returns every active document type with the applicant’s document or null', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'app1',
      registrationNumber: 'PPDB-001',
      fullName: 'Ahmad',
      status: 'SUBMITTED',
      revisionNote: null,
      submittedAt: new Date('2026-10-01T00:00:00Z'),
      wave: { name: 'Gelombang 1' },
      payment: { status: 'VERIFIED' },
      documents: [
        {
          id: 'd1',
          documentTypeId: 'kk',
          status: 'PENDING',
          note: null,
          verifiedAt: null,
          file: {
            id: 'f1',
            originalName: 'kk.pdf',
            mimeType: 'application/pdf',
            storageKey: 'production/admission/documents/kk.pdf',
          },
        },
      ],
    })
    const findTypes = jest.fn().mockResolvedValue([
      { id: 'kk', code: 'KK', name: 'Kartu Keluarga', isRequired: true },
      { id: 'surat', code: 'SURAT', name: 'Surat Prestasi', isRequired: false },
    ])
    const repository = new PrismaAdmissionDocumentReviewRepository({
      admissionApplication: { findFirst },
      admissionDocumentType: { findMany: findTypes },
    } as never)

    const context = await repository.findContext('app1')

    expect(findFirst.mock.calls[0][0]).toMatchObject({
      where: { id: 'app1', deletedAt: null },
    })
    expect(findTypes).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, code: true, name: true, isRequired: true },
    })
    expect(context).toMatchObject({
      applicationId: 'app1',
      applicantName: 'Ahmad',
      waveName: 'Gelombang 1',
      paymentStatus: 'VERIFIED',
    })
    expect(context?.slots).toEqual([
      {
        documentTypeId: 'kk',
        code: 'KK',
        name: 'Kartu Keluarga',
        isRequired: true,
        document: expect.objectContaining({ id: 'd1', status: 'PENDING' }),
      },
      {
        documentTypeId: 'surat',
        code: 'SURAT',
        name: 'Surat Prestasi',
        isRequired: false,
        document: null,
      },
    ])
  })

  it('answers null for an unknown or deleted application', async () => {
    const repository = new PrismaAdmissionDocumentReviewRepository({
      admissionApplication: { findFirst: jest.fn().mockResolvedValue(null) },
      admissionDocumentType: { findMany: jest.fn().mockResolvedValue([]) },
    } as never)

    await expect(repository.findContext('missing')).resolves.toBeNull()
  })
})

describe('PrismaAdmissionDocumentReviewRepository writes', () => {
  function transactional(overrides: Record<string, unknown> = {}) {
    const tx = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      admissionApplication: {
        findFirst: jest.fn().mockResolvedValue({ status: 'SUBMITTED' }),
      },
      admissionDocument: {
        findFirst: jest.fn().mockResolvedValue({ id: 'd1' }),
        update: jest.fn().mockResolvedValue({
          id: 'd1',
          documentTypeId: 'kk',
          status: 'REJECTED',
          note: 'Buram',
          verifiedAt: new Date('2026-10-02T00:00:00Z'),
          file: {
            id: 'f1',
            originalName: 'kk.pdf',
            mimeType: 'application/pdf',
            storageKey: 'k',
          },
        }),
      },
      ...overrides,
    }
    const prisma = {
      $transaction: jest.fn((run: (client: unknown) => unknown) => run(tx)),
    }
    return {
      repository: new PrismaAdmissionDocumentReviewRepository(prisma as never),
      tx,
    }
  }

  const input = {
    applicationId: 'app1',
    documentId: 'd1',
    status: 'REJECTED' as const,
    note: 'Buram',
    adminId: 'admin1',
  }

  it('locks the application and records the decision', async () => {
    const { repository, tx } = transactional()

    const result = await repository.saveDecision(input)

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
    expect(tx.admissionDocument.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: expect.objectContaining({
        status: 'REJECTED',
        note: 'Buram',
        verifiedById: 'admin1',
        verifiedAt: expect.any(Date),
      }),
      select: expect.any(Object),
    })
    expect(result).toMatchObject({
      outcome: 'SAVED',
      document: { id: 'd1', status: 'REJECTED' },
    })
  })

  it('writes nothing once the application is no longer submitted', async () => {
    const { repository, tx } = transactional({
      admissionApplication: {
        findFirst: jest.fn().mockResolvedValue({ status: 'REVISION_NEEDED' }),
      },
    })

    await expect(repository.saveDecision(input)).resolves.toEqual({
      outcome: 'NOT_SUBMITTED',
    })
    expect(tx.admissionDocument.update).not.toHaveBeenCalled()
  })

  it('answers not found for an unknown application or a document of another applicant', async () => {
    const missingApplication = transactional({
      admissionApplication: { findFirst: jest.fn().mockResolvedValue(null) },
    })
    const missingDocument = transactional({
      admissionDocument: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    })

    await expect(
      missingApplication.repository.saveDecision(input),
    ).resolves.toEqual({ outcome: 'NOT_FOUND' })
    await expect(
      missingDocument.repository.saveDecision(input),
    ).resolves.toEqual({ outcome: 'NOT_FOUND' })
    expect(missingDocument.tx.admissionDocument.update).not.toHaveBeenCalled()
  })

  it('returns the application for revision only while it is still submitted', async () => {
    const updateMany = jest.fn().mockResolvedValueOnce({ count: 1 })
    updateMany.mockResolvedValueOnce({ count: 0 })
    const repository = new PrismaAdmissionDocumentReviewRepository({
      admissionApplication: { updateMany },
    } as never)

    await expect(
      repository.markRevisionNeeded('app1', 'Catatan'),
    ).resolves.toBe(true)
    await expect(
      repository.markRevisionNeeded('app1', 'Catatan'),
    ).resolves.toBe(false)
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'app1', deletedAt: null, status: 'SUBMITTED' },
      data: { status: 'REVISION_NEEDED', revisionNote: 'Catatan' },
    })
  })
})
