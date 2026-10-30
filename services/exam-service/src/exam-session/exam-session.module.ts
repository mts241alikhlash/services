import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { ProvisioningTokenGuard } from '../core/guards/provisioning-token.guard.js'
import { ExamFileModule } from '../exam-file/exam-file.module.js'
import { ExamPackageModule } from '../exam-package/exam-package.module.js'
import { QuestionModule } from '../question/question.module.js'
import { ExamScheduleModule } from '../exam-schedule/exam-schedule.module.js'
import { StartExamSessionUseCase } from './application/use-cases/start-exam-session/start-exam-session.use-case.js'
import { ListMyExamsUseCase } from './application/use-cases/list-my-exams/list-my-exams.use-case.js'
import { IExamAccessAttemptRepository } from './domain/repositories/exam-access-attempt.repository.js'
import { SessionAccessService } from './application/session-access.service.js'
import { SaveAnswerUseCase } from './application/use-cases/save-answer/save-answer.use-case.js'
import { GetPaperUseCase } from './application/use-cases/get-paper/get-paper.use-case.js'
import { GetSessionFileUseCase } from './application/use-cases/get-session-file/get-session-file.use-case.js'
import { ListSavedAnswersUseCase } from './application/use-cases/list-saved-answers/list-saved-answers.use-case.js'
import { ISessionFinalizer } from './domain/repositories/session-finalizer.port.js'
import { FinalizeDueSessionsJob } from './infrastructure/jobs/finalize-due-sessions.job.js'
import { FinalizeSessionService } from './application/finalize-session.service.js'
import { FinalizeDueSessionsUseCase } from './application/use-cases/finalize-due-sessions/finalize-due-sessions.use-case.js'
import { RecordViolationsUseCase } from './application/use-cases/record-violations/record-violations.use-case.js'
import { IssueStreamTokenUseCase } from './application/use-cases/issue-stream-token/issue-stream-token.use-case.js'
import { ReportCameraBlockedUseCase } from './application/use-cases/report-camera-blocked/report-camera-blocked.use-case.js'
import { CheckStreamTokenUseCase } from './application/use-cases/check-stream-token/check-stream-token.use-case.js'
import { SubmitExamSessionUseCase } from './application/use-cases/submit-exam-session/submit-exam-session.use-case.js'
import { IExamSessionRepository } from './domain/repositories/exam-session.repository.js'
import { PrismaExamAccessAttemptRepository } from './infrastructure/persistence/prisma/prisma-exam-access-attempt.repository.js'
import { PrismaExamSessionRepository } from './infrastructure/persistence/prisma/prisma-exam-session.repository.js'
import { ExamSessionAdminController } from './presentation/http/exam-session-admin.controller.js'
import { ListScheduleSessionsUseCase } from './application/use-cases/list-schedule-sessions/list-schedule-sessions.use-case.js'
import { ReleaseSessionUseCase } from './application/use-cases/release-session/release-session.use-case.js'
import { SessionExamController } from './presentation/http/session-exam.controller.js'
import { StudentExamController } from './presentation/http/student-exam.controller.js'
import { StreamAuthController } from './presentation/http/stream-auth.controller.js'

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    ExamPackageModule,
    ExamScheduleModule,
    ExamFileModule,
    QuestionModule,
  ],
  controllers: [
    StudentExamController,
    SessionExamController,
    ExamSessionAdminController,
    StreamAuthController,
  ],
  providers: [
    { provide: IExamSessionRepository, useClass: PrismaExamSessionRepository },
    {
      provide: IExamAccessAttemptRepository,
      useClass: PrismaExamAccessAttemptRepository,
    },
    FinalizeSessionService,
    { provide: ISessionFinalizer, useExisting: FinalizeSessionService },
    SubmitExamSessionUseCase,
    RecordViolationsUseCase,
    IssueStreamTokenUseCase,
    ReportCameraBlockedUseCase,
    CheckStreamTokenUseCase,
    ProvisioningTokenGuard,
    ListScheduleSessionsUseCase,
    ReleaseSessionUseCase,
    FinalizeDueSessionsUseCase,
    FinalizeDueSessionsJob,
    SessionAccessService,
    GetPaperUseCase,
    SaveAnswerUseCase,
    GetSessionFileUseCase,
    ListSavedAnswersUseCase,
    ListMyExamsUseCase,
    StartExamSessionUseCase,
  ],
  exports: [IExamSessionRepository],
})
export class ExamSessionModule {}
