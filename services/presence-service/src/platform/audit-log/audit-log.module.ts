import { Module } from '@nestjs/common'
import { HttpAuditLogAdapter } from './infrastructure/http/http-audit-log.adapter.js'
import { IAuditLogPort } from './domain/repositories/audit-log.port.js'
import { CreateAuditLogUseCase } from './use-cases/create-audit-log.use-case.js'

@Module({
  providers: [
    { provide: IAuditLogPort, useClass: HttpAuditLogAdapter },
    CreateAuditLogUseCase,
  ],
  exports: [CreateAuditLogUseCase],
})
export class AuditLogModule {}
