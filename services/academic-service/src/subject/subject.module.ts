import { Module } from '@nestjs/common'
import { SubjectController } from './presentation/http/subject.controller.js'
import { PrismaSubjectRepository } from './infrastructure/persistence/prisma/prisma-subject.repository.js'
import { CreateSubjectUseCase } from './application/use-cases/create-subject/create-subject.use-case.js'
import { DeleteSubjectUseCase } from './application/use-cases/delete-subject/delete-subject.use-case.js'
import { GetSubjectByIdUseCase } from './application/use-cases/get-subject-by-id/get-subject-by-id.use-case.js'
import { GetSubjectsUseCase } from './application/use-cases/get-subjects/get-subjects.use-case.js'
import { UpdateSubjectUseCase } from './application/use-cases/update-subject/update-subject.use-case.js'
import { ISubjectRepository } from './domain/repositories/subject.repository.js'

@Module({
  controllers: [SubjectController],
  providers: [
    {
      provide: ISubjectRepository,
      useClass: PrismaSubjectRepository,
    },
    GetSubjectsUseCase,
    GetSubjectByIdUseCase,
    CreateSubjectUseCase,
    UpdateSubjectUseCase,
    DeleteSubjectUseCase,
  ],
  exports: [ISubjectRepository],
})
export class SubjectModule {}
