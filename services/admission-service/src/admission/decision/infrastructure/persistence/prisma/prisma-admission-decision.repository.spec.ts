import { PrismaAdmissionDecisionRepository } from './prisma-admission-decision.repository.js'

const scope = { deletedAt: null }

function queueRepository(counts = [4, 3, 2, 1]) {
  const findMany = jest.fn().mockResolvedValue([])
  const count = jest.fn()
  counts.forEach((value) => count.mockResolvedValueOnce(value))
  count.mockResolvedValue(0)
  const prisma = {
    admissionDocumentType: {
      findMany: jest.fn().mockResolvedValue([{ id: 'kk' }]),
    },
    admissionApplication: { findMany, count },
  }
  return {
    repository: new PrismaAdmissionDecisionRepository(prisma as never),
    findMany,
    count,
  }
}

describe('PrismaAdmissionDecisionRepository.findQueue', () => {
  it('lists verified applicants waiting for a decision, oldest verification first', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({ tab: 'waiting', page: 1, limit: 20 })

    const call = findMany.mock.calls[0][0] as {
      where: unknown
      orderBy: unknown
    }
    expect(call.where).toEqual({
      AND: [scope, { status: 'VERIFIED' }],
    })
    expect(call.orderBy).toEqual([{ verifiedAt: 'asc' }, { id: 'asc' }])
  })

  it('lists accepted, enrolling and enrolled applicants under Diterima', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({ tab: 'accepted', page: 1, limit: 20 })

    const call = findMany.mock.calls[0][0] as {
      where: unknown
      orderBy: unknown
    }
    expect(call.where).toEqual({
      AND: [scope, { status: { in: ['ACCEPTED', 'ENROLLING', 'ENROLLED'] } }],
    })
    expect(call.orderBy).toEqual([{ decidedAt: 'desc' }, { id: 'asc' }])
  })

  it('lists rejected applicants under Ditolak', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({ tab: 'rejected', page: 1, limit: 20 })

    expect((findMany.mock.calls[0][0] as { where: unknown }).where).toEqual({
      AND: [scope, { status: 'REJECTED' }],
    })
  })

  it('filters by wave and a literal search and never lists a draft', async () => {
    const { repository, findMany } = queueRepository()

    await repository.findQueue({
      tab: 'waiting',
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

  it('pages the rows and counts the three tabs within the same scope', async () => {
    const { repository, findMany, count } = queueRepository([6, 5, 4, 3])
    findMany.mockResolvedValue([
      {
        id: 'app1',
        registrationNumber: 'PSB-001',
        fullName: 'Ahmad',
        status: 'VERIFIED',
        submittedAt: new Date('2026-10-01T00:00:00Z'),
        verifiedAt: new Date('2026-10-02T00:00:00Z'),
        decidedAt: null,
        decisionNote: null,
        wave: { name: 'Gelombang 1' },
        documents: [{ documentTypeId: 'kk', status: 'APPROVED' }],
        payment: { status: 'VERIFIED' },
      },
    ])

    const result = await repository.findQueue({
      tab: 'waiting',
      page: 2,
      limit: 20,
    })

    expect(findMany.mock.calls[0][0]).toMatchObject({ skip: 20, take: 20 })
    expect(count).toHaveBeenCalledTimes(4)
    expect(result).toEqual({
      records: [
        {
          applicationId: 'app1',
          registrationNumber: 'PSB-001',
          applicantName: 'Ahmad',
          waveName: 'Gelombang 1',
          status: 'VERIFIED',
          submittedAt: new Date('2026-10-01T00:00:00Z'),
          verifiedAt: new Date('2026-10-02T00:00:00Z'),
          decidedAt: null,
          decisionNote: null,
          paymentStatus: 'VERIFIED',
          documents: [{ documentTypeId: 'kk', status: 'APPROVED' }],
        },
      ],
      total: 6,
      counts: { waiting: 5, accepted: 4, rejected: 3 },
      requiredTypeIds: ['kk'],
    })
  })
})

describe('PrismaAdmissionDecisionRepository decisions', () => {
  it('reads the status of a live application', async () => {
    const findFirst = jest.fn().mockResolvedValue({ status: 'ACCEPTED' })
    const repository = new PrismaAdmissionDecisionRepository({
      admissionApplication: { findFirst },
    } as never)

    await expect(repository.findStatus('app1')).resolves.toEqual({
      status: 'ACCEPTED',
    })
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'app1', deletedAt: null },
      select: { status: true },
    })
  })

  it('returns an accepted application to the queue and clears the decision', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 })
    const repository = new PrismaAdmissionDecisionRepository({
      admissionApplication: { updateMany },
    } as never)

    await expect(repository.cancelAcceptance('app1')).resolves.toBe(true)
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'app1', deletedAt: null, status: 'ACCEPTED' },
      data: {
        status: 'VERIFIED',
        decidedById: null,
        decidedAt: null,
        decisionNote: null,
        nis: null,
      },
    })
  })

  it('returns a rejected application to review and clears the decision', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 })
    const repository = new PrismaAdmissionDecisionRepository({
      admissionApplication: { updateMany },
    } as never)

    await expect(repository.cancelRejection('app1')).resolves.toBe(true)
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'app1', deletedAt: null, status: 'REJECTED' },
      data: {
        status: 'SUBMITTED',
        decidedById: null,
        decidedAt: null,
        decisionNote: null,
      },
    })
  })

  it('answers false when another request changed the status first', async () => {
    const repository = new PrismaAdmissionDecisionRepository({
      admissionApplication: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    } as never)

    await expect(repository.cancelAcceptance('app1')).resolves.toBe(false)
    await expect(repository.cancelRejection('app1')).resolves.toBe(false)
  })
})
