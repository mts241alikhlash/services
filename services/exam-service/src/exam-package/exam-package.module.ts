import { Module } from '@nestjs/common'
import { QuestionModule } from '../question/question.module.js'
import { AddPackageQuestionUseCase } from './application/use-cases/add-package-question/add-package-question.use-case.js'
import { UpdatePackageQuestionUseCase } from './application/use-cases/update-package-question/update-package-question.use-case.js'
import { RemovePackageQuestionUseCase } from './application/use-cases/remove-package-question/remove-package-question.use-case.js'
import { ReorderPackageQuestionsUseCase } from './application/use-cases/reorder-package-questions/reorder-package-questions.use-case.js'
import { TakePackageQuestionsUseCase } from './application/use-cases/take-package-questions/take-package-questions.use-case.js'
import { SubmitExamPackageUseCase } from './application/use-cases/submit-exam-package/submit-exam-package.use-case.js'
import { ApproveExamPackageUseCase } from './application/use-cases/approve-exam-package/approve-exam-package.use-case.js'
import { ReturnExamPackageUseCase } from './application/use-cases/return-exam-package/return-exam-package.use-case.js'
import { CopyExamPackageUseCase } from './application/use-cases/copy-exam-package/copy-exam-package.use-case.js'
import { CreateExamPackageUseCase } from './application/use-cases/create-exam-package/create-exam-package.use-case.js'
import { DeleteExamPackageUseCase } from './application/use-cases/delete-exam-package/delete-exam-package.use-case.js'
import { GetExamPackageUseCase } from './application/use-cases/get-exam-package/get-exam-package.use-case.js'
import { CreateDraftPackageUseCase } from './application/use-cases/create-draft-package/create-draft-package.use-case.js'
import { RenameExamPackageUseCase } from './application/use-cases/rename-exam-package/rename-exam-package.use-case.js'
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
    CreateDraftPackageUseCase,
    RenameExamPackageUseCase,
    GetExamPackageUseCase,
    CreateExamPackageUseCase,
    UpdateExamPackageUseCase,
    DeleteExamPackageUseCase,
    CopyExamPackageUseCase,
    AddPackageQuestionUseCase,
    UpdatePackageQuestionUseCase,
    RemovePackageQuestionUseCase,
    ReorderPackageQuestionsUseCase,
    TakePackageQuestionsUseCase,
    SubmitExamPackageUseCase,
    ApproveExamPackageUseCase,
    ReturnExamPackageUseCase,
  ],
  exports: [IExamPackageRepository],
})
export class ExamPackageModule {}
