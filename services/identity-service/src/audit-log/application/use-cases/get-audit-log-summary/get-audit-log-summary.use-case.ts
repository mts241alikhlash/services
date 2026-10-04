import { Injectable } from '@nestjs/common'
import { IAuditLogRepository } from '../../../domain/repositories/audit-log.repository.js'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

@Injectable()
export class GetAuditLogSummaryUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute() {
    return this.auditLogRepository.summarise(new Date(Date.now() - ONE_DAY_MS))
  }
}
