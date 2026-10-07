import { BadRequestException, Injectable } from '@nestjs/common'
import { AdmissionPaymentStatus } from '../../../../../shared/domain/enums/admission-payment-status.enum.js'
import { UploadPaymentProofUseCase } from '../upload-payment-proof/upload-payment-proof.use-case.js'
import type { UploadPaymentProofForApplicationInput } from '../upload-payment-proof/upload-payment-proof.input.js'
import { VerifyPaymentUseCase } from '../verify-payment/verify-payment.use-case.js'

@Injectable()
export class AddPaymentUseCase {
  constructor(
    private readonly upload: UploadPaymentProofUseCase,
    private readonly verify: VerifyPaymentUseCase,
  ) {}

  async execute(input: UploadPaymentProofForApplicationInput) {
    if (!input.file) {
      throw new BadRequestException('Bukti pembayaran wajib diunggah')
    }
    await this.upload.executeForApplication(input)
    return this.verify.execute({
      applicationId: input.applicationId,
      status: AdmissionPaymentStatus.VERIFIED,
      adminId: input.adminId,
    })
  }
}
