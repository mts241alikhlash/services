import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { serializeWave } from '../../serialize-wave.js'
import { IAdmissionWaveRepository } from '../../../domain/repositories/admission-wave-repository.js'
import type { UpdateAdmissionWaveInput } from './update-admission-wave.input.js'

@Injectable()
export class UpdateAdmissionWaveUseCase {
  constructor(
    private readonly admissionWaveRepository: IAdmissionWaveRepository,
  ) {}

  async execute(id: string, input: UpdateAdmissionWaveInput) {
    const wave = await this.admissionWaveRepository.findById(id)
    if (!wave) {
      throw new NotFoundException('Admission wave not found')
    }

    if (input.code && input.code !== wave.code) {
      const existing = await this.admissionWaveRepository.findByCode(input.code)
      if (existing) {
        throw new ConflictException(
          `Admission wave code '${input.code}' is already in use`,
        )
      }
    }

    const checkStartDate = input.startDate ?? wave.startDate
    const checkEndDate = input.endDate ?? wave.endDate
    if (checkStartDate && checkEndDate) {
      if (new Date(checkEndDate) <= new Date(checkStartDate)) {
        throw new BadRequestException('End date must be after start date')
      }
    }

    const { startDate, endDate, ...rest } = input
    const updated = await this.admissionWaveRepository.update(id, {
      ...rest,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    })
    return serializeWave(updated)
  }
}
