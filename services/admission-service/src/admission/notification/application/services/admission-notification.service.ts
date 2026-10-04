import { Injectable } from '@nestjs/common'
import type { AdmissionNotificationType } from '../../../../shared/domain/enums/admission-notification-type.enum.js'
import { IAdmissionNotificationRepository } from '../../domain/repositories/admission-notification-repository.js'

@Injectable()
export class AdmissionNotificationService {
  constructor(
    private readonly notificationRepository: IAdmissionNotificationRepository,
  ) {}

  async notify(
    applicationId: string,
    type: `${AdmissionNotificationType}`,
    title: string,
    message: string,
  ): Promise<void> {
    await this.notificationRepository.create({
      applicationId,
      type,
      title,
      message,
    })
  }

  async notifyScope(
    waveId: string | null,
    title: string,
    message: string,
  ): Promise<void> {
    await this.notificationRepository.createForScope(waveId, title, message)
  }
}
