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
import type { RequestRevisionInput } from './request-revision.input.js'

@Injectable()
export class RequestRevisionUseCase {
  constructor(
    private readonly admissionApplicationRepository: IAdmissionApplicationRepository,
    private readonly notifications: AdmissionNotificationService,
  ) {}

  async execute(applicationId: string, dto: RequestRevisionInput) {
    const application =
      await this.admissionApplicationRepository.findActiveById(applicationId)
    if (!application) {
      throw new NotFoundException('Application not found')
    }

    try {
      assertTransition(application.status, 'REVISION_NEEDED')
    } catch (error) {
      if (error instanceof AdmissionStatusTransitionError) {
        throw new ConflictException(error.message)
      }
      throw error
    }

    const updated = await this.admissionApplicationRepository.setRevisionNeeded(
      application.id,
      dto.note,
    )

    await this.notifications.notify(
      application.id,
      'STATUS_CHANGE',
      'Pendaftaran perlu revisi',
      `Pendaftaran Anda dikembalikan untuk diperbaiki. Catatan admin: ${dto.note}`,
    )

    return serializeApplicationDetail(updated)
  }
}
