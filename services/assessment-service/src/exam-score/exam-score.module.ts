import { Module } from '@nestjs/common'
import { ListExamScoresUseCase } from './application/use-cases/list-exam-scores/list-exam-scores.use-case.js'
import { UpsertExamScoreUseCase } from './application/use-cases/upsert-exam-score/upsert-exam-score.use-case.js'
import { IExamScoreRepository } from './domain/repositories/exam-score.repository.js'
import { PrismaExamScoreRepository } from './infrastructure/persistence/prisma/prisma-exam-score.repository.js'
import { ExamScoreInternalController } from './presentation/http/exam-score-internal.controller.js'
import { ExamScoreController } from './presentation/http/exam-score.controller.js'

@Module({
  controllers: [ExamScoreController, ExamScoreInternalController],
  providers: [
    { provide: IExamScoreRepository, useClass: PrismaExamScoreRepository },
    UpsertExamScoreUseCase,
    ListExamScoresUseCase,
  ],
})
export class ExamScoreModule {}
