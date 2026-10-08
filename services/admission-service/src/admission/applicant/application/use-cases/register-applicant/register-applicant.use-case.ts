import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common'
import { hashPassword } from '../../../../../shared/utils/hash.helper.js'
import { IReferenceLookupPort } from '../../../../../platform/reference-lookup/reference-lookup.port.js'
import { IAdmissionApplicantRepository } from '../../../domain/repositories/admission-applicant-repository.js'
import type { RegisterApplicantInput } from './register-applicant.input.js'

@Injectable()
export class RegisterApplicantUseCase {
  private readonly logger = new Logger(RegisterApplicantUseCase.name)

  constructor(
    private readonly admissionApplicantRepository: IAdmissionApplicantRepository,
    private readonly lookup: IReferenceLookupPort,
  ) {}

  async execute(input: RegisterApplicantInput) {
    if (input.password !== input.passwordConfirm) {
      throw new BadRequestException('Konfirmasi kata sandi tidak cocok')
    }

    if (Boolean(input.admissionType) !== Boolean(input.targetGradeId)) {
      throw new BadRequestException(
        'Jenis pendaftaran dan tingkat kelas harus diisi bersama',
      )
    }
    const grade = input.targetGradeId
      ? (await this.lookup.listGrades([input.targetGradeId]))[0]
      : undefined
    if (input.targetGradeId && !grade) {
      throw new BadRequestException('Tingkat kelas tidak ditemukan')
    }

    const wave = input.waveId
      ? await this.admissionApplicantRepository.findOpenWave(input.waveId)
      : await this.admissionApplicantRepository.findActiveWave()
    if (!wave) {
      throw new BadRequestException('Pendaftaran sedang tidak dibuka')
    }
    if (
      input.waveId &&
      (await this.admissionApplicantRepository.isWaveFull(wave.id))
    ) {
      throw new ConflictException('Gelombang penuh')
    }

    const identifier = input.email.trim().toLowerCase()
    const identifierTaken =
      await this.admissionApplicantRepository.isIdentifierTaken(identifier)
    if (identifierTaken) {
      throw new ConflictException('Email sudah terdaftar. Silakan masuk.')
    }

    const passwordHash = await hashPassword(input.password)

    const application =
      await this.admissionApplicantRepository.registerApplicant({
        wave,
        identifier,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone ?? null,
        ...(grade && {
          admissionType: input.admissionType,
          targetGradeId: grade.id,
          targetGradeLevel: grade.level,
        }),
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
