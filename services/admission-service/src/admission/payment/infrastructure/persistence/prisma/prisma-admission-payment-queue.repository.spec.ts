import { PrismaAdmissionPaymentQueueRepository } from './prisma-admission-payment-queue.repository.js'

const record = {
  id: 'pay1',
  amount: 150000,
  status: 'PENDING',
  note: null,
  bankName: 'BSI',
  senderAccountName: 'Ahmad Fauzi',
  transferDate: new Date('2026-10-01'),
  verifiedById: null,
  verifiedAt: null,
  updatedAt: new Date('2026-10-02'),
  bankAccount: {
    id: 'acc1',
    bankName: 'BSI',
    accountNumber: '7123456789',
    accountHolder: 'MTs Al-Ikhlash',
  },
  proofFile: {
    id: 'f1',
    filename: 'stored.png',
    originalName: 'bukti.png',
    mimeType: 'image/png',
    sizeBytes: 10,
    storageKey: 'payments/stored.png',
    uploadedBy: 'staff1',
  },
  application: {
    id: 'app1',
    userId: 'parent1',
    registrationNumber: 'PSB-001',
    fullName: 'Ahmad Fauzi',
    status: 'SUBMITTED',
    wave: { id: 'w1', name: 'Gelombang 1' },
  },
}

function makePrisma() {
  return {
    admissionPayment: {
      findMany: jest.fn().mockResolvedValue([record]),
      count: jest.fn().mockResolvedValue(1),
      groupBy: jest.fn().mockResolvedValue([
        { status: 'PENDING', _count: { _all: 1 } },
        { status: 'VERIFIED', _count: { _all: 4 } },
      ]),
    },
    admissionApplication: { findMany: jest.fn().mockResolvedValue([]) },
  }
}

describe('PrismaAdmissionPaymentQueueRepository.findQueue', () => {
  it('lists one status, oldest pending first, with counts for every tab', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionPaymentQueueRepository(prisma as never)

    const result = await repo.findQueue({
      status: 'PENDING',
      page: 2,
      limit: 20,
    })

    expect(prisma.admissionPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: 'PENDING',
          application: { is: { deletedAt: null } },
        },
        orderBy: { updatedAt: 'asc' },
        skip: 20,
        take: 20,
      }),
    )
    expect(prisma.admissionPayment.groupBy).toHaveBeenCalledWith({
      by: ['status'],
      where: { application: { is: { deletedAt: null } } },
      _count: { _all: true },
    })
    expect(result.total).toBe(1)
    expect(result.counts).toEqual({ pending: 1, verified: 4, rejected: 0 })
    expect(result.rows[0]).toMatchObject({
      paymentId: 'pay1',
      applicationId: 'app1',
      registrationNumber: 'PSB-001',
      applicantName: 'Ahmad Fauzi',
      waveName: 'Gelombang 1',
      proofUploadedByStaff: true,
    })
    expect(result.rows[0].proofFile).not.toHaveProperty('uploadedBy')
  })

  it('lists verified and rejected newest first', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionPaymentQueueRepository(prisma as never)

    await repo.findQueue({ status: 'VERIFIED', page: 1, limit: 20 })

    expect(prisma.admissionPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { updatedAt: 'desc' }, skip: 0 }),
    )
  })

  it('narrows by wave and a trimmed case-insensitive search of name and registration number', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionPaymentQueueRepository(prisma as never)

    await repo.findQueue({
      status: 'PENDING',
      search: '  psb_10%  ',
      waveId: 'w1',
      page: 1,
      limit: 20,
    })

    const scope = {
      application: {
        is: {
          deletedAt: null,
          waveId: 'w1',
          OR: [
            { fullName: { contains: 'psb_10%', mode: 'insensitive' } },
            {
              registrationNumber: { contains: 'psb_10%', mode: 'insensitive' },
            },
          ],
        },
      },
    }
    expect(prisma.admissionPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ...scope, status: 'PENDING' } }),
    )
    expect(prisma.admissionPayment.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: scope }),
    )
  })

  it('marks a proof uploaded by the applicant as not staff', async () => {
    const prisma = makePrisma()
    prisma.admissionPayment.findMany.mockResolvedValue([
      {
        ...record,
        proofFile: { ...record.proofFile, uploadedBy: 'parent1' },
      },
    ])
    const repo = new PrismaAdmissionPaymentQueueRepository(prisma as never)

    const result = await repo.findQueue({
      status: 'PENDING',
      page: 1,
      limit: 20,
    })

    expect(result.rows[0].proofUploadedByStaff).toBe(false)
  })
})

describe('PrismaAdmissionPaymentQueueRepository.findEligibleApplications', () => {
  it('offers undecided applications whose payment is not verified', async () => {
    const prisma = makePrisma()
    prisma.admissionApplication.findMany.mockResolvedValue([
      {
        id: 'app1',
        registrationNumber: 'PSB-001',
        fullName: 'Ahmad Fauzi',
        status: 'DRAFT',
        wave: { name: 'Gelombang 1' },
        payment: { amount: 150000 },
      },
    ])
    const repo = new PrismaAdmissionPaymentQueueRepository(prisma as never)

    const rows = await repo.findEligibleApplications('ahmad', 20)

    expect(prisma.admissionApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          status: { in: ['DRAFT', 'SUBMITTED', 'REVISION_NEEDED'] },
          payment: { is: { status: { not: 'VERIFIED' } } },
          OR: [
            { fullName: { contains: 'ahmad', mode: 'insensitive' } },
            { registrationNumber: { contains: 'ahmad', mode: 'insensitive' } },
          ],
        },
        take: 20,
      }),
    )
    expect(rows).toEqual([
      {
        applicationId: 'app1',
        registrationNumber: 'PSB-001',
        applicantName: 'Ahmad Fauzi',
        applicationStatus: 'DRAFT',
        waveName: 'Gelombang 1',
        amount: 150000,
      },
    ])
  })

  it('does not filter by text when the search is empty', async () => {
    const prisma = makePrisma()
    const repo = new PrismaAdmissionPaymentQueueRepository(prisma as never)

    await repo.findEligibleApplications(undefined, 20)

    expect(prisma.admissionApplication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ OR: expect.anything() }),
      }),
    )
  })
})
