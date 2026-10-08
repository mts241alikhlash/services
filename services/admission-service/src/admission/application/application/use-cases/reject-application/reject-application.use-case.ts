import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  APPLICATION_CHANGED_MESSAGE,
  assertTransition,
  AdmissionStatusTransitionError,
} from '../../../domain/policies/admission-status.transitions.js'
import { serializeApplicationDetail } from '../../../domain/serializers/admission.serializers.js'
import { IAdmissionApplicationRepository } from '../../../domain/repositories/admission-application-repository.js'
import { AdmissionNotificationService } from '../../../../notification/index.js'
import type { RejectApplicationInput } from './reject-application.input.js'

@Injectable()
export class RejectApplicationUseCase {
  constructor(
    private readonly admissionApplicationRepository: IAdmissionApplicationRepository,
    private readonly notifications: AdmissionNotificationService,
  ) {}

  async execute(
    applicationId: string,
    dto: RejectApplicationInput,
    adminId: string,
  ) {
    const application =
      await this.admissionApplicationRepository.findActiveById(applicationId)
    if (!application) {
      throw new NotFoundException('Pendaftar tidak ditemukan')
    }

    try {
      assertTransition(application.status, 'REJECTED')
    } catch (error) {
      if (error instanceof AdmissionStatusTransitionError) {
        throw new ConflictException(APPLICATION_CHANGED_MESSAGE)
      }
      throw error
    }

    const updated = await this.admissionApplicationRepository.setRejected({
      id: application.id,
      adminId,
      reason: dto.reason,
      ...(dto.onlyVerified && { onlyVerified: true }),
    })

    await this.notifications.notify(
      application.id,
      'STATUS_CHANGE',
      'Hasil seleksi pendaftaran',
      `Mohon maaf, berdasarkan hasil seleksi, pendaftaran Anda belum dapat kami terima. Alasan: ${dto.reason}. Terima kasih atas minat Anda mendaftar.`,
    )

    return serializeApplicationDetail(updated)
  }
}
