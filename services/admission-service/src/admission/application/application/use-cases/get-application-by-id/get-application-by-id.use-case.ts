import { Injectable, NotFoundException } from '@nestjs/common'
import { IAdmissionApplicationRepository } from '../../../domain/repositories/admission-application-repository.js'
import { serializeApplicationDetail } from '../../../domain/serializers/admission.serializers.js'

@Injectable()
export class GetApplicationByIdUseCase {
  constructor(
    private readonly admissionApplicationRepository: IAdmissionApplicationRepository,
  ) {}

  async execute(id: string) {
    const application =
      await this.admissionApplicationRepository.findAdminDetailById(id)
    if (!application) {
      throw new NotFoundException('Application not found')
    }

    const duplicateNikCount = application.nik
      ? await this.admissionApplicationRepository.countByNik(
          application.nik,
          application.id,
        )
      : 0

    const documentTypes =
      await this.admissionApplicationRepository.findActiveDocumentTypes()

    const waveIsFull =
      application.payment?.status !== 'VERIFIED' &&
      (await this.admissionApplicationRepository.isWaveFull(application.waveId))

    return {
      ...serializeApplicationDetail(application),
      duplicateNikCount,
      documentTypes,
      waveIsFull,
    }
  }
}
