import { Module } from '@nestjs/common'
import { AuthModule } from '../../platform/auth/auth.module.js'
import { AdmissionWaveController } from './presentation/http/admission-wave.controller.js'
import { PrismaAdmissionWaveRepository } from './infrastructure/persistence/prisma/prisma-admission-wave.repository.js'
import { CreateAdmissionWaveUseCase } from './application/use-cases/create-admission-wave/create-admission-wave.use-case.js'
import { DeleteAdmissionWaveUseCase } from './application/use-cases/delete-admission-wave/delete-admission-wave.use-case.js'
import { GetAdmissionWaveByIdUseCase } from './application/use-cases/get-admission-wave-by-id/get-admission-wave-by-id.use-case.js'
import { GetAdmissionWavesUseCase } from './application/use-cases/get-admission-waves/get-admission-waves.use-case.js'
import { UpdateAdmissionWaveUseCase } from './application/use-cases/update-admission-wave/update-admission-wave.use-case.js'
import { IAdmissionWaveRepository } from './domain/repositories/admission-wave-repository.js'

@Module({
  imports: [AuthModule],
  controllers: [AdmissionWaveController],
  providers: [
    {
      provide: IAdmissionWaveRepository,
      useClass: PrismaAdmissionWaveRepository,
    },
    GetAdmissionWavesUseCase,
    GetAdmissionWaveByIdUseCase,
    CreateAdmissionWaveUseCase,
    UpdateAdmissionWaveUseCase,
    DeleteAdmissionWaveUseCase,
  ],
  exports: [IAdmissionWaveRepository],
})
export class WaveModule {}
