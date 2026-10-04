import { Module } from '@nestjs/common'
import { AcademicCalendarTypeController } from './presentation/http/academic-calendar-type.controller.js'
import { PrismaAcademicCalendarTypeRepository } from './infrastructure/persistence/prisma/prisma-academic-calendar-type.repository.js'
import { IAcademicCalendarTypeRepository } from './domain/repositories/academic-calendar-type.repository.js'
import { CreateAcademicCalendarTypeUseCase } from './application/use-cases/create-academic-calendar-type/create-academic-calendar-type.use-case.js'
import { DeleteAcademicCalendarTypeUseCase } from './application/use-cases/delete-academic-calendar-type/delete-academic-calendar-type.use-case.js'
import { GetAcademicCalendarTypeByIdUseCase } from './application/use-cases/get-academic-calendar-type-by-id/get-academic-calendar-type-by-id.use-case.js'
import { GetAcademicCalendarTypesUseCase } from './application/use-cases/get-academic-calendar-types/get-academic-calendar-types.use-case.js'
import { UpdateAcademicCalendarTypeUseCase } from './application/use-cases/update-academic-calendar-type/update-academic-calendar-type.use-case.js'

@Module({
  controllers: [AcademicCalendarTypeController],
  providers: [
    {
      provide: IAcademicCalendarTypeRepository,
      useClass: PrismaAcademicCalendarTypeRepository,
    },
    GetAcademicCalendarTypesUseCase,
    GetAcademicCalendarTypeByIdUseCase,
    CreateAcademicCalendarTypeUseCase,
    UpdateAcademicCalendarTypeUseCase,
    DeleteAcademicCalendarTypeUseCase,
  ],
  exports: [IAcademicCalendarTypeRepository],
})
export class AcademicCalendarTypeModule {}
