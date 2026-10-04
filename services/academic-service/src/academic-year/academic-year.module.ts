import { Module } from '@nestjs/common'
import { AcademicYearController } from './presentation/http/academic-year.controller.js'
import { PrismaAcademicYearRepository } from './infrastructure/persistence/prisma/prisma-academic-year.repository.js'
import { ActivateAcademicYearUseCase } from './application/use-cases/activate-academic-year/activate-academic-year.use-case.js'
import { CreateAcademicYearUseCase } from './application/use-cases/create-academic-year/create-academic-year.use-case.js'
import { DeactivateAcademicYearUseCase } from './application/use-cases/deactivate-academic-year/deactivate-academic-year.use-case.js'
import { DeleteAcademicYearUseCase } from './application/use-cases/delete-academic-year/delete-academic-year.use-case.js'
import { GetAcademicYearByIdUseCase } from './application/use-cases/get-academic-year-by-id/get-academic-year-by-id.use-case.js'
import { GetAcademicYearsUseCase } from './application/use-cases/get-academic-years/get-academic-years.use-case.js'
import { UpdateAcademicYearUseCase } from './application/use-cases/update-academic-year/update-academic-year.use-case.js'
import { IAcademicYearRepository } from './domain/repositories/academic-year.repository.js'
import { AcademicYearInternalController } from './presentation/http/academic-year-internal.controller.js'

@Module({
  controllers: [AcademicYearInternalController, AcademicYearController],
  providers: [
    {
      provide: IAcademicYearRepository,
      useClass: PrismaAcademicYearRepository,
    },
    GetAcademicYearsUseCase,
    GetAcademicYearByIdUseCase,
    CreateAcademicYearUseCase,
    UpdateAcademicYearUseCase,
    DeleteAcademicYearUseCase,
    ActivateAcademicYearUseCase,
    DeactivateAcademicYearUseCase,
  ],
  exports: [IAcademicYearRepository],
})
export class AcademicYearModule {}
