import { Injectable, Logger } from '@nestjs/common'
import { JsonObject } from '../../../shared/domain/types/json.type.js'
import { CreateAuditLogUseCase } from '../../../platform/audit-log/use-cases/create-audit-log.use-case.js'

export const PAYROLL_AUDIT_RESOURCE = 'payroll'

export type PayrollAuditAction =
  | 'payroll.run.create'
  | 'payroll.run.recalculate'
  | 'payroll.run.submit'
  | 'payroll.run.approve'
  | 'payroll.payslip.read'
  | 'payroll.payslip.read-own'
  | 'payroll.payslip.denied'

@Injectable()
export class PayrollAuditService {
  private readonly logger = new Logger(PayrollAuditService.name)

  constructor(private readonly createAuditLog: CreateAuditLogUseCase) {}

  async record(
    action: PayrollAuditAction,
    actorId: string | null,
    resourceId: string | null,
    metadata: JsonObject = {},
  ): Promise<void> {
    try {
      await this.createAuditLog.execute({
        userId: actorId,
        action,
        resource: PAYROLL_AUDIT_RESOURCE,
        resourceId,
        metadata,
      })
    } catch (error) {
      this.logger.error(
        `Audit write failed for ${action} on ${resourceId ?? 'payroll'}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }
}
