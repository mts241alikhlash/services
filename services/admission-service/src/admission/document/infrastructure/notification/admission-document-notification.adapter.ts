import { Injectable } from '@nestjs/common'
import { AdmissionNotificationService } from '../../../notification/index.js'
import { IAdmissionDocumentNotificationPort } from '../../domain/repositories/admission-document-notification.port.js'

@Injectable()
export class AdmissionDocumentNotificationAdapter extends IAdmissionDocumentNotificationPort {
  constructor(private readonly notifications: AdmissionNotificationService) {
    super()
  }

  notify(
    applicationId: string,
    type: Parameters<AdmissionNotificationService['notify']>[1],
    title: string,
    message: string,
  ): Promise<void> {
    return this.notifications.notify(applicationId, type, title, message)
  }
}
