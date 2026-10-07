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
import type { IAdmissionBankAccountRepository } from '../../../bank-account/index.js'

function makePaymentRepository(
  overrides: Partial<IAdmissionPaymentRepository> = {},
): IAdmissionPaymentRepository {
  return {
    findApplicationWithPayment: jest.fn(),
    findByApplicationId: jest.fn(),
    savePaymentProof: jest.fn(),
    findPayment: jest.fn(),
    updatePaymentStatus: jest.fn(),
    verifyWithinQuota: jest.fn(),
    cancelVerification: jest.fn(),
    isWaveFull: jest.fn(),
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

  it('refuses to reject a payment that is already verified', async () => {
    const payments = makePaymentRepository({
      findPayment: jest.fn().mockResolvedValue({
        id: 'pay1',
        status: 'VERIFIED',
        proofFileId: 'file1',
      }),
    })
    const notifications = { notify: jest.fn() }
    const useCase = new VerifyPaymentUseCase(payments, notifications)

    await expect(
      useCase.execute({
        applicationId: 'app1',
        status: AdmissionPaymentStatus.REJECTED,
        note: 'Salah',
        adminId: 'admin1',
      }),
    ).rejects.toThrow(
      new ConflictException(
        'Pembayaran sudah diverifikasi, batalkan verifikasi terlebih dahulu',
      ),
    )
    expect(payments.updatePaymentStatus).not.toHaveBeenCalled()
    expect(notifications.notify).not.toHaveBeenCalled()
  })

  it('refuses to verify a payment whose proof was never uploaded', async () => {
    const payments = makePaymentRepository({
      findPayment: jest
        .fn()
        .mockResolvedValue({ id: 'pay1', status: 'UNPAID', proofFileId: null }),
    })
    const useCase = new VerifyPaymentUseCase(payments, { notify: jest.fn() })

    await expect(
      useCase.execute({
        applicationId: 'app1',
        status: AdmissionPaymentStatus.VERIFIED,
        adminId: 'admin1',
      }),
    ).rejects.toThrow(ConflictException)
    expect(payments.updatePaymentStatus).not.toHaveBeenCalled()
  })

  it('verifies an uploaded proof through the quota check and tells the applicant', async () => {
    const notify = jest.fn()
    const payments = makePaymentRepository({
      findPayment: jest.fn().mockResolvedValue({
        id: 'pay1',
        status: 'PENDING',
        proofFileId: 'f1',
      }),
      verifyWithinQuota: jest.fn().mockResolvedValue({
        outcome: 'VERIFIED',
        payment: { id: 'pay1', status: 'VERIFIED', amount: 150000 },
        movedApplicationIds: [],
        targetWave: null,
      }),
    })
    const useCase = new VerifyPaymentUseCase(payments, { notify })

    await useCase.execute({
      applicationId: 'app1',
      status: AdmissionPaymentStatus.VERIFIED,
      adminId: 'admin1',
    })

    expect(payments.verifyWithinQuota).toHaveBeenCalledWith({
      applicationId: 'app1',
      paymentId: 'pay1',
      note: null,
      adminId: 'admin1',
    })
    expect(payments.updatePaymentStatus).not.toHaveBeenCalled()
    expect(notify).toHaveBeenCalledWith(
      'app1',
      'PAYMENT',
      'Pembayaran terverifikasi',
      expect.any(String),
    )
  })

  it('refuses to verify into a full wave', async () => {
    const notify = jest.fn()
    const payments = makePaymentRepository({
      findPayment: jest.fn().mockResolvedValue({
        id: 'pay1',
        status: 'PENDING',
        proofFileId: 'f1',
      }),
      verifyWithinQuota: jest.fn().mockResolvedValue({ outcome: 'FULL' }),
    })
    const useCase = new VerifyPaymentUseCase(payments, { notify })

    await expect(
      useCase.execute({
        applicationId: 'app1',
        status: AdmissionPaymentStatus.VERIFIED,
        adminId: 'admin1',
      }),
    ).rejects.toThrow('Gelombang penuh')
    expect(notify).not.toHaveBeenCalled()
  })

  it('tells every moved applicant their new wave and fee', async () => {
    const notify = jest.fn()
    const payments = makePaymentRepository({
      findPayment: jest.fn().mockResolvedValue({
        id: 'pay1',
        status: 'PENDING',
        proofFileId: 'f1',
      }),
      verifyWithinQuota: jest.fn().mockResolvedValue({
        outcome: 'VERIFIED',
        payment: { id: 'pay1', status: 'VERIFIED', amount: 150000 },
        movedApplicationIds: ['app2', 'app3'],
        targetWave: { id: 'w2', name: 'Gelombang 2', registrationFee: 200000 },
      }),
    })
    const useCase = new VerifyPaymentUseCase(payments, { notify })

    await useCase.execute({
      applicationId: 'app1',
      status: AdmissionPaymentStatus.VERIFIED,
      adminId: 'admin1',
    })

    for (const id of ['app2', 'app3']) {
      expect(notify).toHaveBeenCalledWith(
        id,
        'GENERAL',
        'Anda dipindahkan ke Gelombang 2',
        expect.stringMatching(/Rp\s?200\.000/),
      )
    }
  })

  describe('UploadPaymentProofUseCase.executeForApplication', () => {
    const activeAccount = {
      id: 'acc-1',
      bankName: 'BSI',
      accountNumber: '7123456789',
      accountHolder: 'MTs Al-Ikhlash',
      sortOrder: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const bankAccounts = {
      findById: jest
        .fn()
        .mockImplementation((id: string) =>
          Promise.resolve(id === 'acc-1' ? activeAccount : null),
        ),
    } as unknown as IAdmissionBankAccountRepository

    const storage: IAdmissionFileStorage = {
      save: jest.fn(),
    }
    const file = {
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      mimetype: 'image/png',
      size: 1024,
      originalname: 'bukti.png',
    }

    it('resolves the application by id, not by user', async () => {
      const payments = makePaymentRepository({
        findByApplicationId: jest.fn().mockResolvedValue(null),
      })
      const useCase = new UploadPaymentProofUseCase(
        payments,
        storage,
        bankAccounts,
      )

      await expect(
        useCase.executeForApplication({
          applicationId: 'app1',
          bankName: 'BSI',
          bankAccountId: 'acc-1',
          senderAccountName: 'Budi',
          file: file,
          adminId: 'admin1',
        }),
      ).rejects.toThrow(NotFoundException)
      expect(payments.findApplicationWithPayment).not.toHaveBeenCalled()
    })

    it('refuses a destination account that is unknown or inactive', async () => {
      const payments = makePaymentRepository({
        findApplicationWithPayment: jest.fn().mockResolvedValue({
          status: 'DRAFT',
          payment: { id: 'pay1', status: 'UNPAID' },
        }),
      })
      const useCase = new UploadPaymentProofUseCase(
        payments,
        storage,
        bankAccounts,
      )

      await expect(
        useCase.execute({
          userId: 'u1',
          bankName: 'BSI',
          bankAccountId: 'gone',
          senderAccountName: 'Budi',
          file: file,
        }),
      ).rejects.toThrow('Rekening tujuan tidak tersedia')
      expect(payments.savePaymentProof).not.toHaveBeenCalled()
    })

    it('refuses a transfer date after today', async () => {
      const payments = makePaymentRepository({
        findApplicationWithPayment: jest.fn().mockResolvedValue({
          status: 'DRAFT',
          payment: { id: 'pay1', status: 'UNPAID' },
        }),
      })
      const useCase = new UploadPaymentProofUseCase(
        payments,
        storage,
        bankAccounts,
      )

      await expect(
        useCase.execute({
          userId: 'u1',
          bankName: 'BSI',
          bankAccountId: 'acc-1',
          senderAccountName: 'Budi',
          transferDate: new Date('2999-01-01T00:00:00.000Z'),
          file: file,
        }),
      ).rejects.toThrow(BadRequestException)
      expect(payments.savePaymentProof).not.toHaveBeenCalled()
    })

    it('accepts a proof after the application is submitted', async () => {
      const payments = makePaymentRepository({
        findApplicationWithPayment: jest.fn().mockResolvedValue({
          status: 'SUBMITTED',
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
      const useCase = new UploadPaymentProofUseCase(
        payments,
        savingStorage,
        bankAccounts,
      )

      await useCase.execute({
        userId: 'u1',
        bankName: 'BSI',
        bankAccountId: 'acc-1',
        senderAccountName: 'Budi',
        file: file,
      })

      expect(payments.savePaymentProof).toHaveBeenCalled()
    })

    it('refuses a proof once the application has been verified', async () => {
      const payments = makePaymentRepository({
        findApplicationWithPayment: jest.fn().mockResolvedValue({
          status: 'VERIFIED',
          payment: { id: 'pay1', status: 'PENDING' },
        }),
      })
      const useCase = new UploadPaymentProofUseCase(
        payments,
        storage,
        bankAccounts,
      )

      await expect(
        useCase.execute({
          userId: 'u1',
          bankName: 'BSI',
          bankAccountId: 'acc-1',
          senderAccountName: 'Budi',
          file: file,
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('refuses an upload once the payment is verified', async () => {
      const payments = makePaymentRepository({
        findByApplicationId: jest.fn().mockResolvedValue({
          status: 'DRAFT',
          payment: { id: 'pay1', status: 'VERIFIED' },
        }),
      })
      const useCase = new UploadPaymentProofUseCase(
        payments,
        storage,
        bankAccounts,
      )

      await expect(
        useCase.executeForApplication({
          applicationId: 'app1',
          bankName: 'BSI',
          bankAccountId: 'acc-1',
          senderAccountName: 'Budi',
          file: file,
          adminId: 'admin1',
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('refuses a proof upload while the wave is full', async () => {
      const payments = makePaymentRepository({
        findByApplicationId: jest.fn().mockResolvedValue({
          status: 'SUBMITTED',
          waveId: 'w1',
          payment: { id: 'pay1', status: 'UNPAID' },
        }),
        isWaveFull: jest.fn().mockResolvedValue(true),
      })
      const useCase = new UploadPaymentProofUseCase(
        payments,
        storage,
        bankAccounts,
      )

      await expect(
        useCase.executeForApplication({
          applicationId: 'app1',
          bankName: 'BSI',
          bankAccountId: 'acc-1',
          senderAccountName: 'Budi',
          file: file,
          adminId: 'admin1',
        }),
      ).rejects.toThrow('Gelombang penuh')
      expect(payments.isWaveFull).toHaveBeenCalledWith('w1')
      expect(payments.savePaymentProof).not.toHaveBeenCalled()
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
      const useCase = new UploadPaymentProofUseCase(
        payments,
        savingStorage,
        bankAccounts,
      )

      await useCase.executeForApplication({
        applicationId: 'app1',
        bankName: 'BSI',
        bankAccountId: 'acc-1',
        senderAccountName: 'Budi',
        file: file,
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
