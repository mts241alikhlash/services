import { Module } from '@nestjs/common'
import { SemesterTypeController } from './presentation/http/semester-type.controller.js'
import { PrismaSemesterTypeRepository } from './infrastructure/persistence/prisma/prisma-semester-type.repository.js'
import { ISemesterTypeRepository } from './domain/repositories/semester-type.repository.js'
import { CreateSemesterTypeUseCase } from './application/use-cases/create-semester-type/create-semester-type.use-case.js'
import { DeleteSemesterTypeUseCase } from './application/use-cases/delete-semester-type/delete-semester-type.use-case.js'
import { GetSemesterTypeByIdUseCase } from './application/use-cases/get-semester-type-by-id/get-semester-type-by-id.use-case.js'
import { GetSemesterTypesUseCase } from './application/use-cases/get-semester-types/get-semester-types.use-case.js'
import { UpdateSemesterTypeUseCase } from './application/use-cases/update-semester-type/update-semester-type.use-case.js'

@Module({
  controllers: [SemesterTypeController],
  providers: [
    {
      provide: ISemesterTypeRepository,
      useClass: PrismaSemesterTypeRepository,
    },
    GetSemesterTypesUseCase,
    GetSemesterTypeByIdUseCase,
    CreateSemesterTypeUseCase,
    UpdateSemesterTypeUseCase,
    DeleteSemesterTypeUseCase,
  ],
  exports: [ISemesterTypeRepository],
})
export class SemesterTypeModule {}
