import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common'
import { serializeWave } from '../../serialize-wave.js'
import { IAdmissionWaveRepository } from '../../../domain/repositories/admission-wave-repository.js'
import type { CreateAdmissionWaveInput } from './create-admission-wave.input.js'

@Injectable()
export class CreateAdmissionWaveUseCase {
  constructor(
    private readonly admissionWaveRepository: IAdmissionWaveRepository,
  ) {}

  async execute(input: CreateAdmissionWaveInput) {
    const existing = await this.admissionWaveRepository.findByCode(input.code)
    if (existing) {
      throw new ConflictException(
        `Admission wave code '${input.code}' is already in use`,
      )
    }

    if (new Date(input.endDate) <= new Date(input.startDate)) {
      throw new BadRequestException('End date must be after start date')
    }

    const created = await this.admissionWaveRepository.create({
      name: input.name,
      code: input.code,
      academicYearId: input.academicYearId,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      quota: input.quota,
      registrationFee: input.registrationFee,
      description: input.description ?? null,
      isActive: input.isActive ?? true,
    })
    return serializeWave(created)
  }
}
