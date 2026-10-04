import { Injectable, NotFoundException } from '@nestjs/common'
import { IAdmissionNotificationRepository } from '../../../domain/repositories/admission-notification-repository.js'

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    private readonly notificationRepository: IAdmissionNotificationRepository,
  ) {}

  async executeOne(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findMyNotification(
      userId,
      notificationId,
    )
    if (!notification) {
      throw new NotFoundException('Notification not found')
    }

    return this.notificationRepository.markNotificationRead(
      notification.id,
      notification.readAt ?? new Date(),
    )
  }

  async executeAll(userId: string) {
    await this.notificationRepository.markAllNotificationsRead(userId)
    return { success: true }
  }
}
