import { ConflictException, Injectable } from '@nestjs/common'
import { serializeApplicationDetail } from '../../../../application/domain/serializers/admission.serializers.js'
import { IAdmissionApplicantRepository } from '../../../domain/repositories/admission-applicant-repository.js'
import type { EnsureMyApplicationInput } from './ensure-my-application.input.js'

@Injectable()
export class EnsureMyApplicationUseCase {
  constructor(
    private readonly admissionApplicantRepository: IAdmissionApplicantRepository,
  ) {}

  async execute(input: EnsureMyApplicationInput) {
    const existing = await this.admissionApplicantRepository.findMyDetail(
      input.userId,
    )
    if (existing) {
      return {
        ...serializeApplicationDetail(existing),
        documentTypes:
          await this.admissionApplicantRepository.findActiveDocumentTypes(),
      }
    }

    const wave = await this.admissionApplicantRepository.findActiveWave()
    if (!wave) {
      throw new ConflictException('registration is not open')
    }

    const created = await this.admissionApplicantRepository.ensureApplication({
      userId: input.userId,
      waveId: wave.id,
      waveCode: wave.code,
      registrationFee: wave.registrationFee,
    })

    const documentTypes =
      await this.admissionApplicantRepository.findActiveDocumentTypes()
    return { ...serializeApplicationDetail(created), documentTypes }
  }
}
