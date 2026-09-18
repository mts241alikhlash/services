import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { PaymentModule, VerifyPaymentUseCase } from '../../index.js'
import { AdmissionPaymentStatus } from '../../../../shared/domain/enums/admission-payment-status.enum.js'
import { IAdmissionPaymentNotificationPort } from '../../domain/repositories/admission-payment-notification.port.js'
import { IAdmissionPaymentRepository } from '../../domain/repositories/admission-payment-repository.js'
import { IAdmissionFileStorage } from '../../../document/index.js'
import { UploadPaymentProofUseCase } from './upload-payment-proof/upload-payment-proof.use-case.js'

function makePaymentRepository(
  overrides: Partial<IAdmissionPaymentRepository> = {},
): IAdmissionPaymentRepository {
  return {
    findApplicationWithPayment: jest.fn(),
    findByApplicationId: jest.fn(),
    savePaymentProof: jest.fn(),
    findPayment: jest.fn(),
    updatePaymentStatus: jest.fn(),
    ...overrides,
  }
}

describe('Payment layering', () => {
  it('exposes payment operations without HTTP DTOs', () => {
    expect(PaymentModule).toBeDefined()
    expect(VerifyPaymentUseCase).toBeDefined()
  })

  it('requires a note when rejecting payment', async () => {
    const payments = makePaymentRepository()
    const notifications: Pick<IAdmissionPaymentNotificationPort, 'notify'> = {
      notify: jest.fn(),
    }
    const useCase = new VerifyPaymentUseCase(payments, notifications)

    await expect(
      useCase.execute({
        applicationId: 'app1',
        status: AdmissionPaymentStatus.REJECTED,
        adminId: 'admin1',
      }),
    ).rejects.toThrow(BadRequestException)
  })

  describe('UploadPaymentProofUseCase.executeForApplication', () => {
    const storage: IAdmissionFileStorage = {
      save: jest.fn(),
    }
    const file = {
      mimetype: 'image/png',
      size: 1024,
      originalname: 'bukti.png',
    }

    it('resolves the application by id, not by user', async () => {
      const payments = makePaymentRepository({
        findByApplicationId: jest.fn().mockResolvedValue(null),
      })
      const useCase = new UploadPaymentProofUseCase(payments, storage)

      await expect(
        useCase.executeForApplication({
          applicationId: 'app1',
          bankName: 'BSI',
          senderAccountName: 'Budi',
          file: file as never,
          adminId: 'admin1',
        }),
      ).rejects.toThrow(NotFoundException)
      expect(payments.findApplicationWithPayment).not.toHaveBeenCalled()
    })

    it('refuses an upload once the payment is verified', async () => {
      const payments = makePaymentRepository({
        findByApplicationId: jest.fn().mockResolvedValue({
          status: 'DRAFT',
          payment: { id: 'pay1', status: 'VERIFIED' },
        }),
      })
      const useCase = new UploadPaymentProofUseCase(payments, storage)

      await expect(
        useCase.executeForApplication({
          applicationId: 'app1',
          bankName: 'BSI',
          senderAccountName: 'Budi',
          file: file as never,
          adminId: 'admin1',
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('attributes the saved proof to the acting administrator', async () => {
      const payments = makePaymentRepository({
        findByApplicationId: jest.fn().mockResolvedValue({
          status: 'DRAFT',
          payment: { id: 'pay1', status: 'UNPAID' },
        }),
        savePaymentProof: jest.fn().mockResolvedValue({
          id: 'pay1',
          status: 'PENDING',
          proofFile: null,
        }),
      })
      const savingStorage: IAdmissionFileStorage = {
        save: jest.fn().mockResolvedValue({
          filename: 'stored.png',
          storageKey: 'payments/stored.png',
        }),
      }
      const useCase = new UploadPaymentProofUseCase(payments, savingStorage)

      await useCase.executeForApplication({
        applicationId: 'app1',
        bankName: 'BSI',
        senderAccountName: 'Budi',
        file: file as never,
        adminId: 'admin1',
      })

      expect(payments.savePaymentProof).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: 'pay1',
          file: expect.objectContaining({ uploadedBy: 'admin1' }),
        }),
      )
    })
  })
})
