import { Injectable } from '@nestjs/common'
import { GetAuditLogsInput } from './get-audit-logs.input.js'
import { IAuditLogRepository } from '../../../domain/repositories/audit-log.repository.js'

@Injectable()
export class GetAuditLogsUseCase {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(input: GetAuditLogsInput) {
    return this.auditLogRepository.findAll({
      page: input.page,
      limit: input.limit,
      search: input.search,
      userId: input.userId,
      action: input.action,
      resource: input.resource,
    })
  }
}
