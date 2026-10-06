import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  assertValidAdmissionFile,
  IAdmissionFileStorage,
  type AdmissionUploadFile,
} from '../../../../document/index.js'
import {
  IAdmissionPaymentRepository,
  type AdmissionPaymentApplicationRef,
} from '../../../domain/repositories/admission-payment-repository.js'
import { serializePayment } from '../../serialize-payment.js'
import { admissionToday } from '../../../../wave/index.js'
import { IAdmissionBankAccountRepository } from '../../../../bank-account/index.js'
import type {
  UploadPaymentProofForApplicationInput,
  UploadPaymentProofInput,
} from './upload-payment-proof.input.js'

const PAYMENT_UPLOAD_STATUSES = ['DRAFT', 'SUBMITTED', 'REVISION_NEEDED']

@Injectable()
export class UploadPaymentProofUseCase {
  constructor(
    private readonly payments: IAdmissionPaymentRepository,
    private readonly storage: IAdmissionFileStorage,
    private readonly bankAccounts: IAdmissionBankAccountRepository,
  ) {}

  async execute(input: UploadPaymentProofInput) {
    assertValidAdmissionFile(input.file)

    const application = await this.payments.findApplicationWithPayment(
      input.userId,
    )
    if (!application?.payment) {
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
    }

    return this.upload(application, input, input.userId)
  }

  async executeForApplication(input: UploadPaymentProofForApplicationInput) {
    assertValidAdmissionFile(input.file)

    const application = await this.payments.findByApplicationId(
      input.applicationId,
    )
    if (!application?.payment) {
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
    }

    return this.upload(application, input, input.adminId)
  }

  private async upload(
    application: AdmissionPaymentApplicationRef,
    input: {
      bankName: string
      bankAccountId: string
      senderAccountName: string
      transferDate?: Date | null
      file: AdmissionUploadFile
    },
    uploadedBy: string,
  ) {
    if (!application.payment) {
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
    }
    if (!PAYMENT_UPLOAD_STATUSES.includes(application.status)) {
      throw new ConflictException(
        'Bukti pembayaran hanya bisa diunggah sebelum formulir diverifikasi',
      )
    }
    if (application.payment.status === 'VERIFIED') {
      throw new ConflictException('Pembayaran sudah diverifikasi')
    }
    if (await this.payments.isWaveFull(application.waveId)) {
      throw new ConflictException('Gelombang penuh')
    }
    const account = await this.bankAccounts.findById(input.bankAccountId)
    if (!account?.isActive) {
      throw new BadRequestException('Rekening tujuan tidak tersedia')
    }
    if (input.transferDate && input.transferDate > admissionToday()) {
      throw new BadRequestException(
        'Tanggal transfer tidak boleh melewati hari ini',
      )
    }

    const { filename, storageKey } = await this.storage.save(input.file, [
      'payments',
    ])

    const payment = await this.payments.savePaymentProof({
      paymentId: application.payment.id,
      file: {
        filename,
        originalName: input.file.originalname,
        mimeType: input.file.mimetype,
        sizeBytes: input.file.size,
        storageKey,
        uploadedBy,
      },
      bankName: input.bankName,
      bankAccountId: input.bankAccountId,
      senderAccountName: input.senderAccountName,
      transferDate: input.transferDate ?? null,
    })

    return serializePayment(payment)
  }
}
