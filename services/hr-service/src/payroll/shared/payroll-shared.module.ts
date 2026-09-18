import { Module } from '@nestjs/common'
import { AuditLogModule } from '../../platform/audit-log/audit-log.module.js'
import { PayrollAuditService } from './services/payroll-audit.service.js'

@Module({
  imports: [AuditLogModule],
  providers: [PayrollAuditService],
  exports: [PayrollAuditService],
})
export class PayrollSharedModule {}
