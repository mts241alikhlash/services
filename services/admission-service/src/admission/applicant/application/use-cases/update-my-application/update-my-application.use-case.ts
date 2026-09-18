import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { isEditable } from '../../../../application/domain/policies/admission-status.transitions.js'
import type { AdmissionStatus } from '../../../../../shared/domain/enums/admission-status.enum.js'
import { serializeApplicationDetail } from '../../../../application/domain/serializers/admission.serializers.js'
import {
  AdmissionApplicationParentInput,
  IAdmissionApplicantRepository,
} from '../../../domain/repositories/admission-applicant-repository.js'
import type { UpdateMyApplicationInput } from './update-my-application.input.js'

@Injectable()
export class UpdateMyApplicationUseCase {
  constructor(
    private readonly admissionApplicantRepository: IAdmissionApplicantRepository,
  ) {}

  async execute(userId: string, input: UpdateMyApplicationInput) {
    const application =
      await this.admissionApplicantRepository.findMyApplication(userId)
    if (!application) {
      throw new NotFoundException('Application not found')
    }
    return this.update(application, input)
  }

  async executeForApplication(
    applicationId: string,
    input: UpdateMyApplicationInput,
  ) {
    const application =
      await this.admissionApplicantRepository.findDetailById(applicationId)
    if (!application) {
      throw new NotFoundException('Application not found')
    }
    return this.update(application, input)
  }

  private async update(
    application: { id: string; status: `${AdmissionStatus}` },
    input: UpdateMyApplicationInput,
  ) {
    if (!isEditable(application.status)) {
      throw new ConflictException(
        'The form can only be edited while the application is DRAFT or NEEDS_REVISION',
      )
    }

    const { parents, ...data } = input

    const parentInputs: AdmissionApplicationParentInput[] | undefined = parents

    const updated = await this.admissionApplicantRepository.updateMyApplication(
      {
        applicationId: application.id,
        data,
        parents: parentInputs,
      },
    )

    return serializeApplicationDetail(updated)
  }
}
