import { Module } from '@nestjs/common'
import { IAcademicSettingRepository } from './domain/repositories/academic-setting.repository.js'
import { PrismaAcademicSettingRepository } from './infrastructure/persistence/prisma/prisma-academic-setting.repository.js'
import { AcademicSettingController } from './presentation/http/academic-setting.controller.js'
import { GetAcademicSettingUseCase } from './application/use-cases/get-academic-setting/get-academic-setting.use-case.js'
import { UpdateAcademicSettingUseCase } from './application/use-cases/update-academic-setting/update-academic-setting.use-case.js'
import { AcademicSettingInternalController } from './presentation/http/academic-setting-internal.controller.js'

@Module({
  controllers: [AcademicSettingInternalController, AcademicSettingController],
  providers: [
    {
      provide: IAcademicSettingRepository,
      useClass: PrismaAcademicSettingRepository,
    },
    GetAcademicSettingUseCase,
    UpdateAcademicSettingUseCase,
  ],
  exports: [IAcademicSettingRepository],
})
export class AcademicSettingModule {}
