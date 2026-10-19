import { Injectable, NotFoundException } from '@nestjs/common'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { serializeApplicationDetail } from '../../../../application/domain/serializers/admission.serializers.js'
import { IAdmissionApplicantRepository } from '../../../domain/repositories/admission-applicant-repository.js'
import { withDueDates } from '../../late-due-dates.js'

@Injectable()
export class GetMyApplicationUseCase {
  constructor(
    private readonly admissionApplicantRepository: IAdmissionApplicantRepository,
    private readonly referenceLookup: IReferenceLookupPort,
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
      documentTypes: await withDueDates(
        documentTypes,
        application.wave?.academicYearId,
        this.referenceLookup,
      ),
      waveIsFull,
    }
  }
}
