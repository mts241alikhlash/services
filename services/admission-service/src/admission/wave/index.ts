export { WaveModule } from './wave.module.js'
export { IAdmissionWaveRepository } from './domain/repositories/admission-wave-repository.js'
export { GetActiveWavesUseCase } from './application/use-cases/get-active-waves/get-active-waves.use-case.js'
export type {
  ActiveWaveRow,
  AdmissionWaveAcceptedCount,
  AdmissionWaveEntity,
} from './domain/entities/admission-wave.entity.js'
