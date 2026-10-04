import { Module } from '@nestjs/common'
import { EmploymentTypeController } from './presentation/http/employment-type.controller.js'
import { PrismaEmploymentTypeRepository } from './infrastructure/persistence/prisma/prisma-employment-type.repository.js'
import { IEmploymentTypeRepository } from './domain/repositories/employment-type.repository.js'
import { CreateEmploymentTypeUseCase } from './application/use-cases/create-employment-type/create-employment-type.use-case.js'
import { GetEmploymentTypesUseCase } from './application/use-cases/get-employment-types/get-employment-types.use-case.js'
import { GetEmploymentTypeByIdUseCase } from './application/use-cases/get-employment-type-by-id/get-employment-type-by-id.use-case.js'
import { UpdateEmploymentTypeUseCase } from './application/use-cases/update-employment-type/update-employment-type.use-case.js'
import { DeleteEmploymentTypeUseCase } from './application/use-cases/delete-employment-type/delete-employment-type.use-case.js'

@Module({
  controllers: [EmploymentTypeController],
  providers: [
    {
      provide: IEmploymentTypeRepository,
      useClass: PrismaEmploymentTypeRepository,
    },
    GetEmploymentTypesUseCase,
    GetEmploymentTypeByIdUseCase,
    CreateEmploymentTypeUseCase,
    UpdateEmploymentTypeUseCase,
    DeleteEmploymentTypeUseCase,
  ],
  exports: [IEmploymentTypeRepository],
})
export class EmploymentTypeModule {}
