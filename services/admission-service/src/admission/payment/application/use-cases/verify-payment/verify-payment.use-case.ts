import { AdmissionPaymentStatus } from '../../../../../shared/domain/enums/admission-payment-status.enum.js'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IAdmissionPaymentNotificationPort } from '../../../domain/repositories/admission-payment-notification.port.js'
import { IAdmissionPaymentRepository } from '../../../domain/repositories/admission-payment-repository.js'
import { serializePayment } from '../../serialize-payment.js'
import type { VerifyPaymentInput } from './verify-payment.input.js'

@Injectable()
export class VerifyPaymentUseCase {
  constructor(
    private readonly payments: IAdmissionPaymentRepository,
    private readonly notifications: IAdmissionPaymentNotificationPort,
  ) {}

  async execute(input: VerifyPaymentInput) {
    if (
      input.status === AdmissionPaymentStatus.REJECTED &&
      !input.note?.trim()
    ) {
      throw new BadRequestException('A payment rejection reason is required')
    }

    const payment = await this.payments.findPayment(input.applicationId)
    if (!payment) {
      throw new NotFoundException('Payment record not found')
    }
    if (payment.status === 'UNPAID' || !payment.proofFileId) {
      throw new ConflictException('Payment proof has not been uploaded')
    }

    const updated = await this.payments.updatePaymentStatus(payment.id, {
      status: input.status,
      note: input.note ?? null,
      adminId: input.adminId,
    })

    await this.notifications.notify(
      input.applicationId,
      'PAYMENT',
      input.status === AdmissionPaymentStatus.VERIFIED
        ? 'Pembayaran terverifikasi'
        : 'Bukti pembayaran ditolak',
      input.status === AdmissionPaymentStatus.VERIFIED
        ? 'Bukti pembayaran Anda telah diverifikasi.'
        : `Bukti pembayaran Anda ditolak. Catatan: ${input.note}. Silakan unggah ulang.`,
    )

    return serializePayment(updated)
  }
}
