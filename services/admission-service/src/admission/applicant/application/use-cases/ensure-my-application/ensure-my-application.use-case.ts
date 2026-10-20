import { ConflictException, Injectable } from '@nestjs/common'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { serializeApplicationDetail } from '../../../../application/domain/serializers/admission.serializers.js'
import { IAdmissionApplicantRepository } from '../../../domain/repositories/admission-applicant-repository.js'
import { withDueDates } from '../../late-due-dates.js'
import type { EnsureMyApplicationInput } from './ensure-my-application.input.js'

@Injectable()
export class EnsureMyApplicationUseCase {
  constructor(
    private readonly admissionApplicantRepository: IAdmissionApplicantRepository,
    private readonly referenceLookup: IReferenceLookupPort,
  ) {}

  async execute(input: EnsureMyApplicationInput) {
    const existing = await this.admissionApplicantRepository.findMyDetail(
      input.userId,
    )
    if (existing) {
      return {
        ...serializeApplicationDetail(existing),
        documentTypes: await withDueDates(
          await this.admissionApplicantRepository.findActiveDocumentTypes(),
          existing.wave?.academicYearId,
          this.referenceLookup,
        ),
        waveIsFull:
          existing.payment?.status !== 'VERIFIED' &&
          (await this.admissionApplicantRepository.isWaveFull(existing.waveId)),
      }
    }

    const wave = await this.admissionApplicantRepository.findActiveWave()
    if (!wave) {
      throw new ConflictException('Pendaftaran sedang tidak dibuka')
    }

    const created = await this.admissionApplicantRepository.ensureApplication({
      userId: input.userId,
      waveId: wave.id,
      waveCode: wave.code,
      registrationFee: wave.registrationFee,
    })

    const documentTypes =
      await this.admissionApplicantRepository.findActiveDocumentTypes()
    return {
      ...serializeApplicationDetail(created),
      documentTypes: await withDueDates(
        documentTypes,
        wave.academicYearId,
        this.referenceLookup,
      ),
      waveIsFull: false,
    }
  }
}
