import { Module } from '@nestjs/common'
import { QuestionModule } from '../question/question.module.js'
import { CopyExamPackageUseCase } from './application/use-cases/copy-exam-package/copy-exam-package.use-case.js'
import { CreateExamPackageUseCase } from './application/use-cases/create-exam-package/create-exam-package.use-case.js'
import { DeleteExamPackageUseCase } from './application/use-cases/delete-exam-package/delete-exam-package.use-case.js'
import { GetExamPackageUseCase } from './application/use-cases/get-exam-package/get-exam-package.use-case.js'
import { ListPackageCandidatesUseCase } from './application/use-cases/list-package-candidates/list-package-candidates.use-case.js'
import { ListExamPackagesUseCase } from './application/use-cases/list-exam-packages/list-exam-packages.use-case.js'
import { UpdateExamPackageUseCase } from './application/use-cases/update-exam-package/update-exam-package.use-case.js'
import { IExamPackageRepository } from './domain/repositories/exam-package.repository.js'
import { PrismaExamPackageRepository } from './infrastructure/persistence/prisma/prisma-exam-package.repository.js'
import { ExamPackageController } from './presentation/http/exam-package.controller.js'

@Module({
  imports: [QuestionModule],
  controllers: [ExamPackageController],
  providers: [
    { provide: IExamPackageRepository, useClass: PrismaExamPackageRepository },
    ListExamPackagesUseCase,
    ListPackageCandidatesUseCase,
    GetExamPackageUseCase,
    CreateExamPackageUseCase,
    UpdateExamPackageUseCase,
    DeleteExamPackageUseCase,
    CopyExamPackageUseCase,
  ],
  exports: [IExamPackageRepository],
})
export class ExamPackageModule {}
