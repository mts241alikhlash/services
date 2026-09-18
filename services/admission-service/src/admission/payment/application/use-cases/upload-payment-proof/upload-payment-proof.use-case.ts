import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { isEditable } from '../../../../application/domain/policies/admission-status.transitions.js'
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
import type {
  UploadPaymentProofForApplicationInput,
  UploadPaymentProofInput,
} from './upload-payment-proof.input.js'

@Injectable()
export class UploadPaymentProofUseCase {
  constructor(
    private readonly payments: IAdmissionPaymentRepository,
    private readonly storage: IAdmissionFileStorage,
  ) {}

  async execute(input: UploadPaymentProofInput) {
    assertValidAdmissionFile(input.file)

    const application = await this.payments.findApplicationWithPayment(
      input.userId,
    )
    if (!application?.payment) {
      throw new NotFoundException('Application not found')
    }

    return this.upload(application, input, input.userId)
  }

  async executeForApplication(input: UploadPaymentProofForApplicationInput) {
    assertValidAdmissionFile(input.file)

    const application = await this.payments.findByApplicationId(
      input.applicationId,
    )
    if (!application?.payment) {
      throw new NotFoundException('Application not found')
    }

    return this.upload(application, input, input.adminId)
  }

  private async upload(
    application: AdmissionPaymentApplicationRef,
    input: {
      bankName: string
      senderAccountName: string
      transferDate?: Date | null
      file: AdmissionUploadFile
    },
    uploadedBy: string,
  ) {
    if (!application.payment) {
      throw new NotFoundException('Application not found')
    }
    if (!isEditable(application.status as Parameters<typeof isEditable>[0])) {
      throw new ConflictException(
        'Payment proof can only be uploaded while the application is DRAFT or NEEDS_REVISION',
      )
    }
    if (application.payment.status === 'VERIFIED') {
      throw new ConflictException('The payment has already been verified')
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
      senderAccountName: input.senderAccountName,
      transferDate: input.transferDate ?? null,
    })

    return serializePayment(payment)
  }
}
