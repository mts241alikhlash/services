import type { AdmissionNotificationType } from '../../../../shared/domain/enums/admission-notification-type.enum.js'
import type { AdmissionNotificationEntity } from '../entities/admission-notification.entity.js'

export interface CreateAdmissionNotificationInput {
  applicationId: string
  type: `${AdmissionNotificationType}`
  title: string
  message: string
}

export interface AdmissionNotificationList {
  data: AdmissionNotificationEntity[]
  unreadCount: number
}

export abstract class IAdmissionNotificationRepository {
  abstract create(
    input: CreateAdmissionNotificationInput,
  ): Promise<AdmissionNotificationEntity>
  abstract createForScope(
    waveId: string | null,
    title: string,
    message: string,
  ): Promise<void>
  abstract findApplicationIdByUser(userId: string): Promise<string | null>
  abstract findNotifications(
    applicationId: string,
  ): Promise<AdmissionNotificationList>
  abstract findMyNotification(
    userId: string,
    notificationId: string,
  ): Promise<AdmissionNotificationEntity | null>
  abstract markNotificationRead(
    notificationId: string,
    readAt: Date,
  ): Promise<AdmissionNotificationEntity>
  abstract markAllNotificationsRead(userId: string): Promise<void>
}
