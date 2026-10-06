import { Injectable, NotFoundException } from '@nestjs/common'
import { serializeApplicationDetail } from '../../../../application/domain/serializers/admission.serializers.js'
import { IAdmissionApplicantRepository } from '../../../domain/repositories/admission-applicant-repository.js'

@Injectable()
export class GetMyApplicationUseCase {
  constructor(
    private readonly admissionApplicantRepository: IAdmissionApplicantRepository,
  ) {}

  async execute(userId: string) {
    const application =
      await this.admissionApplicantRepository.findMyDetail(userId)
    if (!application) {
      throw new NotFoundException('Formulir pendaftaran tidak ditemukan')
    }

    const documentTypes =
      await this.admissionApplicantRepository.findActiveDocumentTypes()

    const waveIsFull =
      application.payment?.status !== 'VERIFIED' &&
      (await this.admissionApplicantRepository.isWaveFull(application.waveId))

    return {
      ...serializeApplicationDetail(application),
      documentTypes,
      waveIsFull,
    }
  }
}
