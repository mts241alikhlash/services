import { Injectable, Logger } from '@nestjs/common'
import {
  CreateAuditLogInput,
  IAuditLogPort,
} from '../domain/repositories/audit-log.port.js'

@Injectable()
export class CreateAuditLogUseCase {
  private readonly logger = new Logger(CreateAuditLogUseCase.name)

  constructor(private readonly auditLogPort: IAuditLogPort) {}

  async execute(data: CreateAuditLogInput): Promise<void> {
    await this.auditLogPort.create(data)
    this.logger.log(`Audit log created: ${data.action} on ${data.resource}`)
  }
}
