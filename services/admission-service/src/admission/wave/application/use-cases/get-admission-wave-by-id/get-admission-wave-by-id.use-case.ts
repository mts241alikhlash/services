import { Injectable, NotFoundException } from '@nestjs/common'
import { serializeWave } from '../../serialize-wave.js'
import { IAdmissionWaveRepository } from '../../../domain/repositories/admission-wave-repository.js'

@Injectable()
export class GetAdmissionWaveByIdUseCase {
  constructor(
    private readonly admissionWaveRepository: IAdmissionWaveRepository,
  ) {}

  async execute(id: string) {
    const wave = await this.admissionWaveRepository.findById(id)
    if (!wave) {
      throw new NotFoundException('Admission wave not found')
    }
    return serializeWave(wave)
  }
}
