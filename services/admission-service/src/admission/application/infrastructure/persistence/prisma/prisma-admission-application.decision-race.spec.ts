import { ConflictException } from '@nestjs/common'
import { PrismaAdmissionApplicationRepository } from './prisma-admission-application.repository.js'

function setup(current: {
  status: string
  payment: { status: string } | null
}) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    admissionApplication: {
      findUnique: jest.fn().mockResolvedValue(current),
      update: jest.fn().mockResolvedValue({ id: 'app1' }),
    },
  }
  const prisma = {
    $transaction: jest.fn((run: (client: typeof tx) => unknown) => run(tx)),
  }
  const repo = new PrismaAdmissionApplicationRepository(
    prisma as never,
    {} as never,
    {} as never,
  )
  jest
    .spyOn(
      repo as unknown as { attachAccountSummary: (row: unknown) => unknown },
      'attachAccountSummary',
    )
    .mockImplementation((row: unknown) => Promise.resolve(row))
  return { repo, tx }
}

describe('decision writes after a concurrent payment cancel', () => {
  it('refuses to accept an application that is no longer verified', async () => {
    const { repo, tx } = setup({
      status: 'SUBMITTED',
      payment: { status: 'PENDING' },
    })

    await expect(
      repo.setAccepted({ id: 'app1', adminId: 'a', note: null }),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(tx.admissionApplication.update).not.toHaveBeenCalled()
  })

  it('refuses to reject an application that is no longer verified or submitted', async () => {
    const { repo, tx } = setup({
      status: 'ACCEPTED',
      payment: { status: 'VERIFIED' },
    })

    await expect(
      repo.setRejected({ id: 'app1', adminId: 'a', reason: 'x' }),
    ).rejects.toBeInstanceOf(ConflictException)
    expect(tx.admissionApplication.update).not.toHaveBeenCalled()
  })

  it('refuses to verify an application whose payment went back to pending', async () => {
    const { repo, tx } = setup({
      status: 'SUBMITTED',
      payment: { status: 'PENDING' },
    })

    await expect(repo.setVerified('app1', 'a')).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(tx.admissionApplication.update).not.toHaveBeenCalled()
  })

  it('accepts a verified application under the row lock', async () => {
    const { repo, tx } = setup({
      status: 'VERIFIED',
      payment: { status: 'VERIFIED' },
    })

    await repo.setAccepted({ id: 'app1', adminId: 'a', note: null })

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
    expect(tx.admissionApplication.update).toHaveBeenCalledTimes(1)
  })
})
