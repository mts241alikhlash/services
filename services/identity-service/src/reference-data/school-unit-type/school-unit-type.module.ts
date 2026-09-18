import { Module } from '@nestjs/common'
import { SchoolUnitTypeController } from './presentation/http/school-unit-type.controller.js'
import { ISchoolUnitTypeRepository } from './domain/repositories/school-unit-type.repository.js'
import { PrismaSchoolUnitTypeRepository } from './infrastructure/persistence/prisma/prisma-school-unit-type.repository.js'
import { CreateSchoolUnitTypeUseCase } from './application/use-cases/create-school-unit-type/create-school-unit-type.use-case.js'
import { UpdateSchoolUnitTypeUseCase } from './application/use-cases/update-school-unit-type/update-school-unit-type.use-case.js'
import { DeleteSchoolUnitTypeUseCase } from './application/use-cases/delete-school-unit-type/delete-school-unit-type.use-case.js'
import { GetSchoolUnitTypesUseCase } from './application/use-cases/get-school-unit-types/get-school-unit-types.use-case.js'
import { GetSchoolUnitTypeByIdUseCase } from './application/use-cases/get-school-unit-type-by-id/get-school-unit-type-by-id.use-case.js'

@Module({
  controllers: [SchoolUnitTypeController],
  providers: [
    {
      provide: ISchoolUnitTypeRepository,
      useClass: PrismaSchoolUnitTypeRepository,
    },
    CreateSchoolUnitTypeUseCase,
    UpdateSchoolUnitTypeUseCase,
    DeleteSchoolUnitTypeUseCase,
    GetSchoolUnitTypesUseCase,
    GetSchoolUnitTypeByIdUseCase,
  ],
  exports: [ISchoolUnitTypeRepository],
})
export class SchoolUnitTypeModule {}
