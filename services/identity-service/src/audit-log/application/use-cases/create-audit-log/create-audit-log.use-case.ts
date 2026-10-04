import { Injectable, Logger } from '@nestjs/common'
import { CreateAuditLogInput } from './create-audit-log.input.js'
import { IAuditLogRepository } from '../../../domain/repositories/audit-log.repository.js'

@Injectable()
export class CreateAuditLogUseCase {
  private readonly logger = new Logger(CreateAuditLogUseCase.name)

  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(input: CreateAuditLogInput) {
    const log = await this.auditLogRepository.create({
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    })
    this.logger.log(`Audit log created: ${log.action} on ${log.resource}`)
    return log
  }
}
