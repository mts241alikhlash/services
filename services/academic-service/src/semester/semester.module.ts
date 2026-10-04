import { Module } from '@nestjs/common'
import { AcademicYearModule } from '../academic-year/academic-year.module.js'
import { SemesterController } from './presentation/http/semester.controller.js'
import { PrismaSemesterRepository } from './infrastructure/persistence/prisma/prisma-semester.repository.js'
import { ActivateSemesterUseCase } from './application/use-cases/activate-semester/activate-semester.use-case.js'
import { CreateSemesterUseCase } from './application/use-cases/create-semester/create-semester.use-case.js'
import { DeactivateSemesterUseCase } from './application/use-cases/deactivate-semester/deactivate-semester.use-case.js'
import { DeleteSemesterUseCase } from './application/use-cases/delete-semester/delete-semester.use-case.js'
import { GetSemesterByIdUseCase } from './application/use-cases/get-semester-by-id/get-semester-by-id.use-case.js'
import { GetSemestersUseCase } from './application/use-cases/get-semesters/get-semesters.use-case.js'
import { UpdateSemesterUseCase } from './application/use-cases/update-semester/update-semester.use-case.js'
import { ISemesterRepository } from './domain/repositories/semester.repository.js'
import { SemesterInternalController } from './presentation/http/semester-internal.controller.js'

@Module({
  imports: [AcademicYearModule],
  controllers: [SemesterInternalController, SemesterController],
  providers: [
    { provide: ISemesterRepository, useClass: PrismaSemesterRepository },
    GetSemestersUseCase,
    GetSemesterByIdUseCase,
    CreateSemesterUseCase,
    UpdateSemesterUseCase,
    DeleteSemesterUseCase,
    ActivateSemesterUseCase,
    DeactivateSemesterUseCase,
  ],
  exports: [ISemesterRepository],
})
export class SemesterModule {}
