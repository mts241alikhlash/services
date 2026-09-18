import { Injectable, NotFoundException } from '@nestjs/common'
import { IAdmissionNotificationRepository } from '../../../domain/repositories/admission-notification-repository.js'

@Injectable()
export class GetMyNotificationsUseCase {
  constructor(
    private readonly notificationRepository: IAdmissionNotificationRepository,
  ) {}

  async execute(userId: string) {
    const applicationId =
      await this.notificationRepository.findApplicationIdByUser(userId)
    if (!applicationId) {
      throw new NotFoundException('Application not found')
    }

    return this.notificationRepository.findNotifications(applicationId)
  }
}
