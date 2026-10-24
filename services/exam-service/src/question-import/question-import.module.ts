import { Module } from '@nestjs/common'
import { ExamFileModule } from '../exam-file/exam-file.module.js'
import { QuestionModule } from '../question/question.module.js'
import { GetImportTemplateUseCase } from './application/use-cases/get-import-template/get-import-template.use-case.js'
import { ImportQuestionsUseCase } from './application/use-cases/import-questions/import-questions.use-case.js'
import { QuestionImportController } from './presentation/http/question-import.controller.js'

@Module({
  imports: [QuestionModule, ExamFileModule],
  controllers: [QuestionImportController],
  providers: [ImportQuestionsUseCase, GetImportTemplateUseCase],
})
export class QuestionImportModule {}
