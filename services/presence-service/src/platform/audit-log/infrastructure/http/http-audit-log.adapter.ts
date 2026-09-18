import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  CreateAuditLogInput,
  IAuditLogPort,
} from '../../domain/repositories/audit-log.port.js'

const REQUEST_TIMEOUT_MS = 10_000

@Injectable()
export class HttpAuditLogAdapter extends IAuditLogPort {
  private readonly logger = new Logger(HttpAuditLogAdapter.name)

  constructor(private readonly config: ConfigService) {
    super()
  }

  async create(data: CreateAuditLogInput): Promise<void> {
    const base = this.config.get<string>('IDENTITY_SERVICE_URL')
    if (!base) {
      throw new ServiceUnavailableException(
        'IDENTITY_SERVICE_URL is not configured, so no audit entry can be recorded.',
      )
    }

    const token = this.config.get<string>('PROVISIONING_SERVICE_TOKEN')
    if (!token) {
      throw new ServiceUnavailableException(
        'PROVISIONING_SERVICE_TOKEN is not configured, so no audit entry can be recorded.',
      )
    }

    let response: Response
    try {
      response = await fetch(`${base.replace(/\/+$/, '')}/audit-logs`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-provisioning-token': token,
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (cause) {
      this.logger.error(
        `identity-service unreachable at ${base}: ${String(cause)}`,
      )
      throw new ServiceUnavailableException(
        'The identity service could not be reached, so this audit entry was not recorded.',
      )
    }

    if (!response.ok) {
      this.logger.error(
        `identity-service answered ${response.status} for /audit-logs`,
      )
      throw new ServiceUnavailableException(
        'The identity service could not record this audit entry.',
      )
    }
  }
}
