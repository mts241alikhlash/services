import type { AdmissionNotificationType } from '../../../../shared/domain/enums/admission-notification-type.enum.js'

export abstract class IAdmissionDocumentNotificationPort {
  abstract notify(
    applicationId: string,
    type: `${AdmissionNotificationType}`,
    title: string,
    message: string,
  ): Promise<void>
}
