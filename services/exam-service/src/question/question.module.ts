import { Module } from '@nestjs/common'
import { TeacherScope } from './application/teacher-scope.service.js'
import { ApproveManyQuestionsUseCase } from './application/use-cases/approve-many-questions/approve-many-questions.use-case.js'
import { ApproveQuestionUseCase } from './application/use-cases/approve-question/approve-question.use-case.js'
import { ReturnQuestionUseCase } from './application/use-cases/return-question/return-question.use-case.js'
import { SubmitQuestionUseCase } from './application/use-cases/submit-question/submit-question.use-case.js'
import { CreateQuestionUseCase } from './application/use-cases/create-question/create-question.use-case.js'
import { DeleteQuestionUseCase } from './application/use-cases/delete-question/delete-question.use-case.js'
import { GetQuestionUseCase } from './application/use-cases/get-question/get-question.use-case.js'
import { GetQuestionVersionsUseCase } from './application/use-cases/get-question-versions/get-question-versions.use-case.js'
import { ListQuestionsUseCase } from './application/use-cases/list-questions/list-questions.use-case.js'
import { UpdateQuestionUseCase } from './application/use-cases/update-question/update-question.use-case.js'
import { IQuestionRepository } from './domain/repositories/question.repository.js'
import { PrismaQuestionRepository } from './infrastructure/persistence/prisma/prisma-question.repository.js'
import { QuestionController } from './presentation/http/question.controller.js'

@Module({
  controllers: [QuestionController],
  providers: [
    { provide: IQuestionRepository, useClass: PrismaQuestionRepository },
    TeacherScope,
    ListQuestionsUseCase,
    GetQuestionUseCase,
    GetQuestionVersionsUseCase,
    CreateQuestionUseCase,
    UpdateQuestionUseCase,
    DeleteQuestionUseCase,
    SubmitQuestionUseCase,
    ApproveQuestionUseCase,
    ReturnQuestionUseCase,
    ApproveManyQuestionsUseCase,
  ],
  exports: [IQuestionRepository, TeacherScope, CreateQuestionUseCase],
})
export class QuestionModule {}
