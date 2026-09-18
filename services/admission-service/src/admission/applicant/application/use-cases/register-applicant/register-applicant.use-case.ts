import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common'
import { hashPassword } from '../../../../../shared/utils/hash.helper.js'
import { IAdmissionApplicantRepository } from '../../../domain/repositories/admission-applicant-repository.js'
import type { RegisterApplicantInput } from './register-applicant.input.js'

@Injectable()
export class RegisterApplicantUseCase {
  private readonly logger = new Logger(RegisterApplicantUseCase.name)

  constructor(
    private readonly admissionApplicantRepository: IAdmissionApplicantRepository,
  ) {}

  async execute(input: RegisterApplicantInput) {
    if (input.password !== input.passwordConfirm) {
      throw new BadRequestException('Password confirmation does not match')
    }

    const wave = input.waveId
      ? await this.admissionApplicantRepository.findOpenWave(input.waveId)
      : await this.admissionApplicantRepository.findActiveWave()
    if (!wave) {
      throw new BadRequestException('registration is not open')
    }

    const identifier = input.email.trim().toLowerCase()
    const identifierTaken =
      await this.admissionApplicantRepository.isIdentifierTaken(identifier)
    if (identifierTaken) {
      throw new ConflictException(
        'Email is already registered. Sign in instead.',
      )
    }

    const passwordHash = await hashPassword(input.password)

    const application =
      await this.admissionApplicantRepository.registerApplicant({
        wave,
        identifier,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone ?? null,
      })

    this.logger.log(
      `Applicant registered: ${identifier} (${application.registrationNumber})`,
    )

    return {
      id: application.id,
      registrationNumber: application.registrationNumber,
      identifier,
    }
  }
}
