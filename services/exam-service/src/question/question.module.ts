import { Module } from '@nestjs/common'
import { TeacherScope } from './application/teacher-scope.service.js'
import { GetQuestionScopeUseCase } from './application/use-cases/get-question-scope/get-question-scope.use-case.js'
import { IQuestionRepository } from './domain/repositories/question.repository.js'
import { PrismaQuestionRepository } from './infrastructure/persistence/prisma/prisma-question.repository.js'
import { QuestionController } from './presentation/http/question.controller.js'

@Module({
  controllers: [QuestionController],
  providers: [
    { provide: IQuestionRepository, useClass: PrismaQuestionRepository },
    TeacherScope,
    GetQuestionScopeUseCase,
  ],
  exports: [IQuestionRepository, TeacherScope],
})
export class QuestionModule {}
