import { Injectable } from '@nestjs/common'
import { serializeWave } from '../../serialize-wave.js'
import { IAdmissionWaveRepository } from '../../../domain/repositories/admission-wave-repository.js'
import type { GetAdmissionWavesInput } from './get-admission-waves.input.js'

@Injectable()
export class GetAdmissionWavesUseCase {
  constructor(
    private readonly admissionWaveRepository: IAdmissionWaveRepository,
  ) {}

  async execute(input: GetAdmissionWavesInput) {
    const { data, total, page, limit } =
      await this.admissionWaveRepository.findAll({
        page: input.page,
        limit: input.limit,
        search: input.search,
        academicYearId: input.academicYearId,
        isActive: input.isActive,
      })

    return {
      data: data.map(serializeWave),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
