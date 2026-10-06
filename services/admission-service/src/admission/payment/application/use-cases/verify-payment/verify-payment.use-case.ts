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

    if (input.status !== AdmissionPaymentStatus.VERIFIED) {
      const rejected = await this.payments.updatePaymentStatus(payment.id, {
        status: input.status,
        note: input.note ?? null,
        adminId: input.adminId,
      })
      await this.notifications.notify(
        input.applicationId,
        'PAYMENT',
        'Bukti pembayaran perlu diunggah ulang',
        `Bukti pembayaran Anda belum dapat kami terima. Catatan panitia: ${input.note}. Silakan unggah ulang bukti transfer yang sesuai.`,
      )
      return serializePayment(rejected)
    }

    const result = await this.payments.verifyWithinQuota({
      applicationId: input.applicationId,
      paymentId: payment.id,
      note: input.note ?? null,
      adminId: input.adminId,
    })
    if (result.outcome === 'FULL') {
      throw new ConflictException('Gelombang penuh')
    }

    await this.notifications.notify(
      input.applicationId,
      'PAYMENT',
      'Pembayaran terverifikasi',
      'Pembayaran biaya pendaftaran Anda telah diverifikasi panitia.',
    )

    const target = result.targetWave
    if (target) {
      const fee = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
      }).format(target.registrationFee)
      for (const applicationId of result.movedApplicationIds) {
        await this.notifications.notify(
          applicationId,
          'GENERAL',
          `Anda dipindahkan ke ${target.name}`,
          `Kuota gelombang sebelumnya sudah penuh, sehingga pendaftaran Anda dipindahkan ke ${target.name}. Biaya pendaftaran menjadi ${fee}. Bila bukti transfer Anda tidak sesuai, panitia akan meminta Anda mengunggah ulang.`,
        )
      }
    }

    return serializePayment(result.payment)
  }
}
