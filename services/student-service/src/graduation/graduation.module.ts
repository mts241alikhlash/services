import { Module } from '@nestjs/common'
import { GraduationController } from './presentation/http/graduation.controller.js'
import { PrismaGraduationRepository } from './infrastructure/persistence/prisma/prisma-graduation.repository.js'
import { IGraduationRepository } from './domain/repositories/graduation.repository.js'
import { CreateStudentGraduationUseCase } from './application/use-cases/create-student-graduation/create-student-graduation.use-case.js'
import { UpdateStudentGraduationUseCase } from './application/use-cases/update-student-graduation/update-student-graduation.use-case.js'
import { DeleteStudentGraduationUseCase } from './application/use-cases/delete-student-graduation/delete-student-graduation.use-case.js'
import { GetStudentGraduationByIdUseCase } from './application/use-cases/get-student-graduation-by-id/get-student-graduation-by-id.use-case.js'
import { GetStudentGraduationsUseCase } from './application/use-cases/get-student-graduations/get-student-graduations.use-case.js'
import { GetGraduationCandidatesUseCase } from './application/use-cases/get-graduation-candidates/get-graduation-candidates.use-case.js'
import { BulkGraduateStudentsUseCase } from './application/use-cases/bulk-graduate-students/bulk-graduate-students.use-case.js'
import { GetGraduationHoldsUseCase } from './application/use-cases/get-graduation-holds/get-graduation-holds.use-case.js'

@Module({
  controllers: [GraduationController],
  providers: [
    {
      provide: IGraduationRepository,
      useClass: PrismaGraduationRepository,
    },
    GetStudentGraduationsUseCase,
    GetStudentGraduationByIdUseCase,
    CreateStudentGraduationUseCase,
    UpdateStudentGraduationUseCase,
    DeleteStudentGraduationUseCase,
    GetGraduationCandidatesUseCase,
    BulkGraduateStudentsUseCase,
    GetGraduationHoldsUseCase,
  ],
  exports: [IGraduationRepository],
})
export class GraduationModule {}
