import { PrismaAdmissionPaymentRepository } from './prisma-admission-payment.repository.js'
import type { PrismaService } from '../../../../../core/database/prisma.service.js'

function makeRepository(claimedCount: number) {
  const tx = {
    admissionPayment: {
      updateMany: jest.fn().mockResolvedValue({ count: claimedCount }),
      update: jest.fn().mockResolvedValue({ id: 'pay1', proofFileId: 'f1' }),
    },
    file: { create: jest.fn().mockResolvedValue({ id: 'f1' }) },
  }
  const prisma = {
    $transaction: jest.fn((run: (client: typeof tx) => unknown) => run(tx)),
  }
  return {
    tx,
    repository: new PrismaAdmissionPaymentRepository(
      prisma as unknown as PrismaService,
    ),
  }
}

const proof = {
  paymentId: 'pay1',
  file: {
    filename: 'stored.png',
    originalName: 'bukti.png',
    mimeType: 'image/png',
    sizeBytes: 10,
    storageKey: 'payments/stored.png',
    uploadedBy: 'u1',
  },
  bankName: 'BSI',
  bankAccountId: 'acc-1',
  senderAccountName: 'Budi',
  transferDate: null,
}

describe('PrismaAdmissionPaymentRepository.savePaymentProof', () => {
  it('writes nothing, not even the file row, once the payment is verified', async () => {
    const { tx, repository } = makeRepository(0)

    const saved = await repository.savePaymentProof(proof)

    expect(saved).toBeNull()
    expect(tx.admissionPayment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay1', status: { not: 'VERIFIED' } },
      }),
    )
    expect(tx.file.create).not.toHaveBeenCalled()
    expect(tx.admissionPayment.update).not.toHaveBeenCalled()
  })

  it('links the new file to a payment that is not verified', async () => {
    const { tx, repository } = makeRepository(1)

    await repository.savePaymentProof(proof)

    expect(tx.file.create).toHaveBeenCalledWith({ data: proof.file })
    expect(tx.admissionPayment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pay1' },
        data: { proofFileId: 'f1' },
      }),
    )
  })
})
