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
import type { AcceptApplicationInput } from './accept-application.input.js'

@Injectable()
export class AcceptApplicationUseCase {
  constructor(
    private readonly admissionApplicationRepository: IAdmissionApplicationRepository,
    private readonly notifications: AdmissionNotificationService,
  ) {}

  async execute(
    applicationId: string,
    dto: AcceptApplicationInput,
    adminId: string,
  ) {
    const application =
      await this.admissionApplicationRepository.findActiveWithWave(
        applicationId,
      )
    if (!application) {
      throw new NotFoundException('Application not found')
    }

    try {
      assertTransition(application.status, 'ACCEPTED')
    } catch (error) {
      if (error instanceof AdmissionStatusTransitionError) {
        throw new ConflictException(error.message)
      }
      throw error
    }

    const acceptedCount =
      await this.admissionApplicationRepository.countAcceptedInWave(
        application.waveId,
      )
    const quotaWarning =
      acceptedCount >= application.wave.quota
        ? `Wave quota (${application.wave.quota}) is already met; this acceptance exceeds it.`
        : null

    const updated = await this.admissionApplicationRepository.setAccepted({
      id: application.id,
      adminId,
      note: dto.note ?? null,
    })

    await this.notifications.notify(
      application.id,
      'STATUS_CHANGE',
      'Selamat, Anda diterima! 🎉',
      `Selamat! Anda dinyatakan DITERIMA sebagai calon santri baru.${dto.note ? ` Catatan: ${dto.note}` : ''} Silakan tunggu informasi daftar ulang.`,
    )

    return { ...serializeApplicationDetail(updated), quotaWarning }
  }
}
