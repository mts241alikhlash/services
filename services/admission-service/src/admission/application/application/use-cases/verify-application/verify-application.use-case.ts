import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  assertTransition,
  AdmissionStatusTransitionError,
} from '../../../domain/policies/admission-status.transitions.js'
import { serializeApplicationDetail } from '../../../domain/serializers/admission.serializers.js'
import { IAdmissionApplicationRepository } from '../../../domain/repositories/admission-application-repository.js'
import { AdmissionNotificationService } from '../../../../notification/index.js'
import {
  APPLICATION_VERIFIED_NOTIFICATION,
  unapprovedRequiredTypeIds,
} from '../../../../verification/index.js'

@Injectable()
export class VerifyApplicationUseCase {
  constructor(
    private readonly admissionApplicationRepository: IAdmissionApplicationRepository,
    private readonly notifications: AdmissionNotificationService,
  ) {}

  async execute(applicationId: string, adminId: string) {
    const application =
      await this.admissionApplicationRepository.findActiveWithDocsAndPayment(
        applicationId,
      )
    if (!application) {
      throw new NotFoundException('Application not found')
    }

    try {
      assertTransition(application.status, 'VERIFIED')
    } catch (error) {
      if (error instanceof AdmissionStatusTransitionError) {
        throw new ConflictException(error.message)
      }
      throw error
    }

    const requiredTypes =
      await this.admissionApplicationRepository.findRequiredActiveDocumentTypes()
    const missingIds = unapprovedRequiredTypeIds(
      requiredTypes.map((type) => type.id),
      application.documents ?? [],
    )
    const unapproved = requiredTypes.filter((type) =>
      missingIds.includes(type.id),
    )
    if (unapproved.length > 0) {
      throw new ConflictException(
        `All required documents must be approved first: ${unapproved
          .map((t) => t.name)
          .join(', ')}`,
      )
    }

    if (application.payment?.status !== 'VERIFIED') {
      throw new ConflictException('The payment must be verified first')
    }

    const updated = await this.admissionApplicationRepository.setVerified(
      application.id,
      adminId,
    )

    await this.notifications.notify(
      application.id,
      'STATUS_CHANGE',
      APPLICATION_VERIFIED_NOTIFICATION.title,
      APPLICATION_VERIFIED_NOTIFICATION.message,
    )

    return serializeApplicationDetail(updated)
  }
}
