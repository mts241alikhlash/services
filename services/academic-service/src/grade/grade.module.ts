import { Module } from '@nestjs/common'
import { GradesController } from './presentation/http/grade.controller.js'
import { GradeAcademicYearController } from './presentation/http/grade-academic-year.controller.js'
import { PrismaGradeRepository } from './infrastructure/persistence/prisma/prisma-grade.repository.js'
import { PrismaGradeAcademicYearRepository } from './infrastructure/persistence/prisma/prisma-grade-academic-year.repository.js'
import { CreateGradeUseCase } from './application/use-cases/create-grade/create-grade.use-case.js'
import { DeleteGradeUseCase } from './application/use-cases/delete-grade/delete-grade.use-case.js'
import { GetGradeByIdUseCase } from './application/use-cases/get-grade-by-id/get-grade-by-id.use-case.js'
import { GetGradesUseCase } from './application/use-cases/get-grades/get-grades.use-case.js'
import { UpdateGradeUseCase } from './application/use-cases/update-grade/update-grade.use-case.js'
import { AssignCurriculumToGradeUseCase } from './application/use-cases/assign-curriculum-to-grade/assign-curriculum-to-grade.use-case.js'
import { GetGradeAcademicYearsUseCase } from './application/use-cases/get-grade-academic-years/get-grade-academic-years.use-case.js'
import { RemoveCurriculumFromGradeUseCase } from './application/use-cases/remove-curriculum-from-grade/remove-curriculum-from-grade.use-case.js'
import { IGradeRepository } from './domain/repositories/grade.repository.js'
import { IGradeAcademicYearRepository } from './domain/repositories/grade-academic-year.repository.js'
import { GradeInternalController } from './presentation/http/grade-internal.controller.js'

@Module({
  controllers: [
    GradeInternalController,
    GradesController,
    GradeAcademicYearController,
  ],
  providers: [
    {
      provide: IGradeRepository,
      useClass: PrismaGradeRepository,
    },
    {
      provide: IGradeAcademicYearRepository,
      useClass: PrismaGradeAcademicYearRepository,
    },
    GetGradesUseCase,
    GetGradeByIdUseCase,
    CreateGradeUseCase,
    UpdateGradeUseCase,
    DeleteGradeUseCase,
    AssignCurriculumToGradeUseCase,
    GetGradeAcademicYearsUseCase,
    RemoveCurriculumFromGradeUseCase,
  ],
  exports: [IGradeRepository, IGradeAcademicYearRepository],
})
export class GradeModule {}
