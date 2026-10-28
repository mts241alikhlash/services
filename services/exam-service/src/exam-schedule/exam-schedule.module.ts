import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ExamPackageModule } from '../exam-package/exam-package.module.js'
import { AccessCodeService } from './application/access-code.service.js'
import { CancelExamScheduleUseCase } from './application/use-cases/cancel-exam-schedule/cancel-exam-schedule.use-case.js'
import { CreateExamScheduleUseCase } from './application/use-cases/create-exam-schedule/create-exam-schedule.use-case.js'
import { GetAccessCodeUseCase } from './application/use-cases/get-access-code/get-access-code.use-case.js'
import { GetExamScheduleUseCase } from './application/use-cases/get-exam-schedule/get-exam-schedule.use-case.js'
import { ListExamSchedulesUseCase } from './application/use-cases/list-exam-schedules/list-exam-schedules.use-case.js'
import { RotateAccessCodeUseCase } from './application/use-cases/rotate-access-code/rotate-access-code.use-case.js'
import { UpdateExamScheduleUseCase } from './application/use-cases/update-exam-schedule/update-exam-schedule.use-case.js'
import { IScheduleSessionGuard } from './domain/ports/schedule-session-guard.port.js'
import { PrismaScheduleSessionGuard } from './infrastructure/persistence/prisma/prisma-schedule-session-guard.js'
import { IExamScheduleRepository } from './domain/repositories/exam-schedule.repository.js'
import { PrismaExamScheduleRepository } from './infrastructure/persistence/prisma/prisma-exam-schedule.repository.js'
import { ExamScheduleController } from './presentation/http/exam-schedule.controller.js'

@Module({
  imports: [ExamPackageModule],
  controllers: [ExamScheduleController],
  providers: [
    { provide: IScheduleSessionGuard, useClass: PrismaScheduleSessionGuard },
    {
      provide: IExamScheduleRepository,
      useClass: PrismaExamScheduleRepository,
    },
    {
      provide: AccessCodeService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new AccessCodeService(
          config.getOrThrow<string>('EXAM_ACCESS_CODE_SECRET'),
        ),
    },
    ListExamSchedulesUseCase,
    GetExamScheduleUseCase,
    CreateExamScheduleUseCase,
    UpdateExamScheduleUseCase,
    CancelExamScheduleUseCase,
    GetAccessCodeUseCase,
    RotateAccessCodeUseCase,
  ],
  exports: [IExamScheduleRepository, AccessCodeService],
})
export class ExamScheduleModule {}
