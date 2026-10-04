import { Module } from '@nestjs/common'
import { AuditLogModule } from '../../platform/audit-log/audit-log.module.js'
import { AttendancePeriodModule } from '../attendance-period/attendance-period.module.js'
import { CredentialModule } from '../credential/credential.module.js'
import { WorkPatternModule } from '../work-pattern/work-pattern.module.js'
import { IDailyPresenceReadPort } from './domain/interfaces/daily-presence-read.port.js'
import { IPresenceCorrectionRepository } from './domain/interfaces/presence-correction-repository.interface.js'
import { IDailyPresenceRepository } from './domain/interfaces/daily-presence-repository.interface.js'
import { PrismaDailyPresenceRepository } from './infrastructure/persistence/prisma-daily-presence.repository.js'
import { PrismaPresenceCorrectionRepository } from './infrastructure/persistence/prisma-presence-correction.repository.js'
import { DayStatusService } from './services/day-status.service.js'
import { DailyRecordInternalController } from './presentation/daily-record-internal.controller.js'
import { DailyRecordController } from './presentation/daily-record.controller.js'
import { PresenceAuditService } from './services/presence-audit.service.js'
import { CreateDailyPresenceUseCase } from './use-cases/create-daily-presence.use-case.js'
import {
  GetDailyPresenceByIdUseCase,
  GetDailyPresencesUseCase,
  GetMyDailyPresencesUseCase,
} from './use-cases/get-daily-presences.use-case.js'
import {
  ExportPresenceRecapUseCase,
  GetPresenceRecapUseCase,
} from './use-cases/get-presence-recap.use-case.js'
import { UpdateDailyPresenceUseCase } from './use-cases/update-daily-presence.use-case.js'

@Module({
  controllers: [DailyRecordInternalController, DailyRecordController],
  imports: [
    CredentialModule,
    WorkPatternModule,
    AttendancePeriodModule,
    AuditLogModule,
  ],
  providers: [
    PrismaDailyPresenceRepository,
    {
      provide: IDailyPresenceRepository,
      useExisting: PrismaDailyPresenceRepository,
    },
    {
      provide: IDailyPresenceReadPort,
      useExisting: PrismaDailyPresenceRepository,
    },
    {
      provide: IPresenceCorrectionRepository,
      useClass: PrismaPresenceCorrectionRepository,
    },
    DayStatusService,
    PresenceAuditService,
    UpdateDailyPresenceUseCase,
    CreateDailyPresenceUseCase,
    GetDailyPresencesUseCase,
    GetDailyPresenceByIdUseCase,
    GetMyDailyPresencesUseCase,
    GetPresenceRecapUseCase,
    ExportPresenceRecapUseCase,
  ],
  exports: [IDailyPresenceRepository, IDailyPresenceReadPort, DayStatusService],
})
export class DailyRecordModule {}
