import type { AdmissionNotificationType } from '../../../../shared/domain/enums/admission-notification-type.enum.js'

export abstract class IAdmissionPaymentNotificationPort {
  abstract notify(
    applicationId: string,
    type: `${AdmissionNotificationType}`,
    title: string,
    message: string,
  ): Promise<void>
}
