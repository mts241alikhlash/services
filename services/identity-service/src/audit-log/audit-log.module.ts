import { Module } from '@nestjs/common'
import { AuditLogController } from './presentation/http/audit-log.controller.js'
import { AuditLogIngestController } from './presentation/http/audit-log-ingest.controller.js'
import { PrismaAuditLogRepository } from './infrastructure/persistence/prisma/prisma-audit-log.repository.js'
import { IAuditLogRepository } from './domain/repositories/audit-log.repository.js'
import { GetAuditLogSummaryUseCase } from './application/use-cases/get-audit-log-summary/get-audit-log-summary.use-case.js'
import { GetAuditLogsUseCase } from './application/use-cases/get-audit-logs/get-audit-logs.use-case.js'
import { CreateAuditLogUseCase } from './application/use-cases/create-audit-log/create-audit-log.use-case.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({
  imports: [AuthModule],
  controllers: [AuditLogController, AuditLogIngestController],
  providers: [
    { provide: IAuditLogRepository, useClass: PrismaAuditLogRepository },
    GetAuditLogsUseCase,
    GetAuditLogSummaryUseCase,
    CreateAuditLogUseCase,
  ],
  exports: [IAuditLogRepository, CreateAuditLogUseCase],
})
export class AuditLogModule {}
