import {
  ConflictException,
  Injectable,
  Logger,
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
import type { AcceptApplicationInput } from './accept-application.input.js'

@Injectable()
export class AcceptApplicationUseCase {
  private readonly logger = new Logger(AcceptApplicationUseCase.name)

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
      throw new NotFoundException('Pendaftar tidak ditemukan')
    }

    try {
      assertTransition(application.status, 'ACCEPTED')
    } catch (error) {
      if (error instanceof AdmissionStatusTransitionError) {
        throw new ConflictException(APPLICATION_CHANGED_MESSAGE)
      }
      throw error
    }

    const updated = await this.admissionApplicationRepository.setAccepted({
      id: application.id,
      adminId,
      note: dto.note ?? null,
    })

    try {
      await this.notifications.notify(
        application.id,
        'STATUS_CHANGE',
        'Selamat, Anda dinyatakan diterima',
        `Berdasarkan hasil seleksi, Anda dinyatakan diterima sebagai calon santri baru.${dto.note ? ` Catatan panitia: ${dto.note}.` : ''} Informasi daftar ulang akan disampaikan melalui akun ini.`,
      )
    } catch (error) {
      this.logger.error(
        `Notifying ${application.id} of the acceptance failed`,
        error instanceof Error ? error.stack : undefined,
      )
    }

    return serializeApplicationDetail(updated)
  }
}
