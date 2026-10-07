import { PrismaAdmissionPaymentRepository } from './prisma-admission-payment.repository.js'

function makePrisma(
  found: {
    status: string
    application: { status: string }
  } | null,
) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    admissionPayment: {
      findFirst: jest.fn().mockResolvedValue(found),
      update: jest.fn().mockResolvedValue({ id: 'pay1', status: 'PENDING' }),
    },
    admissionApplication: { update: jest.fn().mockResolvedValue({}) },
  }
  const prisma = {
    $transaction: jest.fn((run: (client: typeof tx) => unknown) => run(tx)),
  }
  return { prisma, tx }
}

const input = {
  applicationId: 'app1',
  paymentId: 'pay1',
  note: 'Salah nominal',
}

describe('PrismaAdmissionPaymentRepository.cancelVerification', () => {
  it('returns the payment to pending and reopens a verified application', async () => {
    const { prisma, tx } = makePrisma({
      status: 'VERIFIED',
      application: { status: 'VERIFIED' },
    })
    const repo = new PrismaAdmissionPaymentRepository(prisma as never)

    const result = await repo.cancelVerification(input)

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
    expect(tx.admissionPayment.update).toHaveBeenCalledWith({
      where: { id: 'pay1' },
      data: {
        status: 'PENDING',
        note: 'Salah nominal',
        verifiedById: null,
        verifiedAt: null,
      },
      include: { proofFile: true, bankAccount: true },
    })
    expect(tx.admissionApplication.update).toHaveBeenCalledWith({
      where: { id: 'app1' },
      data: { status: 'SUBMITTED', verifiedById: null, verifiedAt: null },
    })
    expect(result).toEqual({
      outcome: 'CANCELLED',
      payment: { id: 'pay1', status: 'PENDING' },
      applicationReopened: true,
    })
  })

  it('leaves the application status alone while it is only submitted', async () => {
    const { prisma, tx } = makePrisma({
      status: 'VERIFIED',
      application: { status: 'SUBMITTED' },
    })
    const repo = new PrismaAdmissionPaymentRepository(prisma as never)

    const result = await repo.cancelVerification(input)

    expect(tx.admissionApplication.update).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      outcome: 'CANCELLED',
      applicationReopened: false,
    })
  })

  it.each(['ACCEPTED', 'ENROLLING', 'REJECTED', 'ENROLLED'])(
    'refuses once the application is %s',
    async (status) => {
      const { prisma, tx } = makePrisma({
        status: 'VERIFIED',
        application: { status },
      })
      const repo = new PrismaAdmissionPaymentRepository(prisma as never)

      await expect(repo.cancelVerification(input)).resolves.toEqual({
        outcome: 'DECIDED',
      })
      expect(tx.admissionPayment.update).not.toHaveBeenCalled()
    },
  )

  it.each([
    [{ status: 'PENDING', application: { status: 'SUBMITTED' } }],
    [null],
  ])('refuses a payment that is not verified: %j', async (found) => {
    const { prisma, tx } = makePrisma(found)
    const repo = new PrismaAdmissionPaymentRepository(prisma as never)

    await expect(repo.cancelVerification(input)).resolves.toEqual({
      outcome: 'NOT_VERIFIED',
    })
    expect(tx.admissionPayment.update).not.toHaveBeenCalled()
  })
})
