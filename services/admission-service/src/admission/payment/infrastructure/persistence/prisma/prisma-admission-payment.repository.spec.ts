import { PrismaAdmissionPaymentRepository } from './prisma-admission-payment.repository.js'
import type { PrismaService } from '../../../../../core/database/prisma.service.js'

function makeTx(options: {
  quota: number
  filled: number
  candidates?: Record<string, unknown>[]
}) {
  const calls: string[] = []
  const tx = {
    $queryRaw: jest.fn().mockImplementation(() => {
      calls.push('lock')
      return Promise.resolve([])
    }),
    admissionApplication: {
      findFirstOrThrow: jest.fn().mockResolvedValue({
        id: 'app1',
        waveId: 'w1',
        wave: {
          id: 'w1',
          academicYearId: 'y1',
          startDate: new Date('2027-01-01'),
          quota: options.quota,
        },
      }),
      groupBy: jest.fn().mockImplementation(() => {
        calls.push('count')
        return Promise.resolve(
          options.filled
            ? [{ waveId: 'w1', _count: { _all: options.filled } }]
            : [],
        )
      }),
      findMany: jest.fn().mockResolvedValue([{ id: 'app2' }, { id: 'app3' }]),
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    admissionWave: {
      findMany: jest.fn().mockResolvedValue(options.candidates ?? []),
    },
    admissionPayment: {
      update: jest.fn().mockResolvedValue({ id: 'pay1', status: 'VERIFIED' }),
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  }
  const prisma = {
    $transaction: jest.fn((fn: (client: typeof tx) => unknown) => fn(tx)),
  } as unknown as PrismaService
  return { prisma, tx, calls }
}

const input = {
  applicationId: 'app1',
  paymentId: 'pay1',
  note: null,
  adminId: 'admin1',
}

describe('PrismaAdmissionPaymentRepository.verifyWithinQuota', () => {
  it('locks the wave before counting and refuses a full wave', async () => {
    const { prisma, tx, calls } = makeTx({ quota: 2, filled: 2 })
    const repo = new PrismaAdmissionPaymentRepository(prisma)

    const result = await repo.verifyWithinQuota(input)

    expect(result).toEqual({ outcome: 'FULL' })
    expect(calls).toEqual(['lock', 'count'])
    expect(tx.admissionPayment.update).not.toHaveBeenCalled()
  })

  it('verifies without moving anyone while seats remain', async () => {
    const { prisma, tx } = makeTx({ quota: 5, filled: 2 })
    const repo = new PrismaAdmissionPaymentRepository(prisma)

    const result = await repo.verifyWithinQuota(input)

    expect(result).toMatchObject({
      outcome: 'VERIFIED',
      movedApplicationIds: [],
      targetWave: null,
    })
    expect(tx.admissionPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay1' },
        data: expect.objectContaining({
          status: 'VERIFIED',
          verifiedById: 'admin1',
        }),
      }),
    )
    expect(tx.admissionApplication.updateMany).not.toHaveBeenCalled()
  })

  it('moves the unverified applicants and rebills them when this verification fills the wave', async () => {
    const { prisma, tx } = makeTx({
      quota: 3,
      filled: 2,
      candidates: [
        {
          id: 'w2',
          name: 'Gelombang 2',
          academicYearId: 'y1',
          startDate: new Date('2027-02-01'),
          quota: 10,
          registrationFee: 200000,
        },
      ],
    })
    const repo = new PrismaAdmissionPaymentRepository(prisma)

    const result = await repo.verifyWithinQuota(input)

    expect(result).toMatchObject({
      outcome: 'VERIFIED',
      movedApplicationIds: ['app2', 'app3'],
      targetWave: { id: 'w2', name: 'Gelombang 2', registrationFee: 200000 },
    })
    expect(tx.admissionApplication.findMany).toHaveBeenCalledWith({
      where: {
        waveId: 'w1',
        deletedAt: null,
        status: { in: ['DRAFT', 'SUBMITTED', 'REVISION_NEEDED', 'VERIFIED'] },
        NOT: { payment: { is: { status: 'VERIFIED' } } },
      },
      select: { id: true },
    })
    expect(tx.admissionApplication.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['app2', 'app3'] } },
      data: { waveId: 'w2' },
    })
    expect(tx.admissionPayment.updateMany).toHaveBeenCalledWith({
      where: { applicationId: { in: ['app2', 'app3'] } },
      data: { amount: 200000 },
    })
  })

  it('leaves the applicants held when no target wave exists', async () => {
    const { prisma, tx } = makeTx({ quota: 3, filled: 2, candidates: [] })
    const repo = new PrismaAdmissionPaymentRepository(prisma)

    const result = await repo.verifyWithinQuota(input)

    expect(result).toMatchObject({ movedApplicationIds: [], targetWave: null })
    expect(tx.admissionApplication.updateMany).not.toHaveBeenCalled()
  })
})
