import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IAdmissionPaymentNotificationPort } from '../../../domain/repositories/admission-payment-notification.port.js'
import { IAdmissionPaymentRepository } from '../../../domain/repositories/admission-payment-repository.js'
import { serializePayment } from '../../serialize-payment.js'
import type { CancelPaymentInput } from './cancel-payment.input.js'

@Injectable()
export class CancelPaymentUseCase {
  constructor(
    private readonly payments: IAdmissionPaymentRepository,
    private readonly notifications: IAdmissionPaymentNotificationPort,
  ) {}

  async execute(input: CancelPaymentInput) {
    const note = input.note?.trim()
    if (!note) {
      throw new BadRequestException('Alasan pembatalan wajib diisi')
    }

    const payment = await this.payments.findPayment(input.applicationId)
    if (!payment) {
      throw new NotFoundException('Data pembayaran tidak ditemukan')
    }

    const result = await this.payments.cancelVerification({
      applicationId: input.applicationId,
      paymentId: payment.id,
      note,
    })
    if (result.outcome === 'NOT_VERIFIED') {
      throw new ConflictException('Pembayaran belum diverifikasi')
    }
    if (result.outcome === 'DECIDED') {
      throw new ConflictException(
        'Pembayaran tidak bisa dibatalkan setelah pendaftaran diputuskan',
      )
    }

    await this.notifications.notify(
      input.applicationId,
      'PAYMENT',
      'Verifikasi pembayaran dibatalkan',
      `Verifikasi pembayaran Anda dibatalkan panitia. Catatan: ${note}. Panitia akan memeriksa kembali.`,
    )

    return serializePayment(result.payment)
  }
}
