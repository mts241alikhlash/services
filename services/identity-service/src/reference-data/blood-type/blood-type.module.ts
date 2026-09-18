import { Module } from '@nestjs/common'
import { IBloodTypeRepository } from './domain/repositories/blood-type.repository.js'
import { PrismaBloodTypeRepository } from './infrastructure/persistence/prisma/prisma-blood-type.repository.js'
import { GetBloodTypesUseCase } from './application/use-cases/get-blood-types/get-blood-types.use-case.js'
import { GetBloodTypeByIdUseCase } from './application/use-cases/get-blood-type-by-id/get-blood-type-by-id.use-case.js'
import { CreateBloodTypeUseCase } from './application/use-cases/create-blood-type/create-blood-type.use-case.js'
import { UpdateBloodTypeUseCase } from './application/use-cases/update-blood-type/update-blood-type.use-case.js'
import { DeleteBloodTypeUseCase } from './application/use-cases/delete-blood-type/delete-blood-type.use-case.js'
import { BloodTypeController } from './presentation/http/blood-type.controller.js'
import { BloodTypeInternalController } from './presentation/http/blood-type-internal.controller.js'

@Module({
  controllers: [BloodTypeInternalController, BloodTypeController],
  providers: [
    { provide: IBloodTypeRepository, useClass: PrismaBloodTypeRepository },
    GetBloodTypesUseCase,
    GetBloodTypeByIdUseCase,
    CreateBloodTypeUseCase,
    UpdateBloodTypeUseCase,
    DeleteBloodTypeUseCase,
  ],
  exports: [IBloodTypeRepository],
})
export class BloodTypeModule {}
