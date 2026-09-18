import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ISchoolUnitIdentityReadPort,
  SchoolUnitProfile,
} from './school-unit-identity.port.js'

const REQUEST_TIMEOUT_MS = 10_000

@Injectable()
export class HttpSchoolUnitIdentityAdapter extends ISchoolUnitIdentityReadPort {
  private readonly logger = new Logger(HttpSchoolUnitIdentityAdapter.name)

  constructor(private readonly config: ConfigService) {
    super()
  }

  async findSchoolUnitProfile(): Promise<SchoolUnitProfile | null> {
    const base = this.config.get<string>('IDENTITY_SERVICE_URL')
    if (!base) {
      throw new ServiceUnavailableException(
        'IDENTITY_SERVICE_URL is not configured, so the school unit profile cannot be resolved.',
      )
    }

    const token = this.config.get<string>('PROVISIONING_SERVICE_TOKEN')
    if (!token) {
      throw new ServiceUnavailableException(
        'PROVISIONING_SERVICE_TOKEN is not configured, so the school unit profile cannot be resolved.',
      )
    }

    let response: Response
    try {
      response = await fetch(
        `${base.replace(/\/+$/, '')}/school-units/profile`,
        {
          headers: { 'x-provisioning-token': token },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      )
    } catch (cause) {
      this.logger.error(
        `identity-service unreachable at ${base}: ${String(cause)}`,
      )
      throw new ServiceUnavailableException(
        'The identity service could not be reached, so the school unit profile cannot be resolved.',
      )
    }

    if (!response.ok) {
      this.logger.error(
        `identity-service answered ${response.status} for /school-units/profile`,
      )
      throw new ServiceUnavailableException(
        'The identity service could not resolve the school unit profile.',
      )
    }

    const body = (await response.json().catch(() => null)) as {
      data?: SchoolUnitProfile | null
    } | null

    return body?.data ?? null
  }
}
