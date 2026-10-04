import type { AdmissionNotificationType } from '../../../../shared/domain/enums/admission-notification-type.enum.js'

export interface AdmissionNotificationEntity {
  id: string
  applicationId: string
  type: `${AdmissionNotificationType}`
  title: string
  message: string
  readAt: Date | null
  createdAt: Date
}
