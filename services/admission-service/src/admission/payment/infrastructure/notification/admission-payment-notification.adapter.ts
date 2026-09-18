import { Injectable } from '@nestjs/common'
import { AdmissionNotificationService } from '../../../notification/index.js'
import { IAdmissionPaymentNotificationPort } from '../../domain/repositories/admission-payment-notification.port.js'

@Injectable()
export class AdmissionPaymentNotificationAdapter extends IAdmissionPaymentNotificationPort {
  constructor(private readonly notifications: AdmissionNotificationService) {
    super()
  }

  async notify(
    applicationId: string,
    type: Parameters<AdmissionNotificationService['notify']>[1],
    title: string,
    message: string,
  ): Promise<void> {
    await this.notifications.notify(applicationId, type, title, message)
  }
}
