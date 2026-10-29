import { Module } from '@nestjs/common'
import { ExamPackageModule } from '../exam-package/exam-package.module.js'
import { ExamScheduleModule } from '../exam-schedule/exam-schedule.module.js'
import { ExamSessionModule } from '../exam-session/exam-session.module.js'
import { QuestionModule } from '../question/question.module.js'
import { GradingScopeService } from './application/grading-scope.service.js'
import { PublishScoresUseCase } from './application/use-cases/publish-scores/publish-scores.use-case.js'
import { IScorePublicationRepository } from './domain/repositories/score-publication.repository.js'
import { PublishScoresJob } from './infrastructure/jobs/publish-scores.job.js'
import { PrismaScorePublicationRepository } from './infrastructure/persistence/prisma-score-publication.repository.js'
import { GradeAnswerUseCase } from './application/use-cases/grade-answer/grade-answer.use-case.js'
import { GetGradingSessionUseCase } from './application/use-cases/get-grading-session/get-grading-session.use-case.js'
import { ListGradingSchedulesUseCase } from './application/use-cases/list-grading-schedules/list-grading-schedules.use-case.js'
import { ListGradingSessionsUseCase } from './application/use-cases/list-grading-sessions/list-grading-sessions.use-case.js'
import { ExamGradingController } from './presentation/http/exam-grading.controller.js'

@Module({
  imports: [
    ExamPackageModule,
    ExamScheduleModule,
    ExamSessionModule,
    QuestionModule,
  ],
  controllers: [ExamGradingController],
  providers: [
    GradingScopeService,
    ListGradingSchedulesUseCase,
    ListGradingSessionsUseCase,
    GetGradingSessionUseCase,
    GradeAnswerUseCase,
    PublishScoresUseCase,
    PublishScoresJob,
    {
      provide: IScorePublicationRepository,
      useClass: PrismaScorePublicationRepository,
    },
  ],
})
export class ExamGradingModule {}
