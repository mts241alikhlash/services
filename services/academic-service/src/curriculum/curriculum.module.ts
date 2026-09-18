import { Module } from '@nestjs/common'
import { AcademicYearModule } from '../academic-year/academic-year.module.js'
import { CurriculumController } from './presentation/http/curriculum.controller.js'
import { CurriculumSubjectController } from './presentation/http/curriculum-subject.controller.js'
import { PrismaCurriculumRepository } from './infrastructure/persistence/prisma/prisma-curriculum.repository.js'
import { PrismaCurriculumSubjectRepository } from './infrastructure/persistence/prisma/prisma-curriculum-subject.repository.js'

import { CreateCurriculaUseCase } from './application/use-cases/create-curriculum/create-curriculum.use-case.js'
import { DeleteCurriculaUseCase } from './application/use-cases/delete-curriculum/delete-curriculum.use-case.js'
import { GetCurriculaByIdUseCase } from './application/use-cases/get-curricula-by-id/get-curricula-by-id.use-case.js'
import { GetCurriculaUseCase } from './application/use-cases/get-curricula/get-curricula.use-case.js'
import { UpdateCurriculaUseCase } from './application/use-cases/update-curriculum/update-curriculum.use-case.js'

import { CreateCurriculumSubjectUseCase } from './application/use-cases/create-curriculum-subject/create-curriculum-subject.use-case.js'
import { BulkCreateCurriculumSubjectsUseCase } from './application/use-cases/bulk-create-curriculum-subjects/bulk-create-curriculum-subjects.use-case.js'
import { DeleteCurriculumSubjectUseCase } from './application/use-cases/delete-curriculum-subject/delete-curriculum-subject.use-case.js'
import { GetCurriculumSubjectByIdUseCase } from './application/use-cases/get-curriculum-subject-by-id/get-curriculum-subject-by-id.use-case.js'
import { GetCurriculumSubjectsUseCase } from './application/use-cases/get-curriculum-subjects/get-curriculum-subjects.use-case.js'
import { UpdateCurriculumSubjectUseCase } from './application/use-cases/update-curriculum-subject/update-curriculum-subject.use-case.js'

import { ICurriculumRepository } from './domain/repositories/curriculum.repository.js'
import { ICurriculumSubjectRepository } from './domain/repositories/curriculum-subject.repository.js'
import { CurriculumSubjectInternalController } from './presentation/http/curriculum-subject-internal.controller.js'

@Module({
  imports: [AcademicYearModule],
  controllers: [
    CurriculumSubjectInternalController,
    CurriculumController,
    CurriculumSubjectController,
  ],
  providers: [
    { provide: ICurriculumRepository, useClass: PrismaCurriculumRepository },
    {
      provide: ICurriculumSubjectRepository,
      useClass: PrismaCurriculumSubjectRepository,
    },
    GetCurriculaUseCase,
    GetCurriculaByIdUseCase,
    CreateCurriculaUseCase,
    UpdateCurriculaUseCase,
    DeleteCurriculaUseCase,
    GetCurriculumSubjectsUseCase,
    GetCurriculumSubjectByIdUseCase,
    CreateCurriculumSubjectUseCase,
    BulkCreateCurriculumSubjectsUseCase,
    UpdateCurriculumSubjectUseCase,
    DeleteCurriculumSubjectUseCase,
  ],
  exports: [ICurriculumRepository, ICurriculumSubjectRepository],
})
export class CurriculumModule {}
