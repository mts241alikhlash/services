import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  AccountLookupResult,
  AccountSummary,
  IAccountProvisioningPort,
  ProvisionAccountInput,
  ProvisionedAccount,
} from '../../domain/repositories/account-provisioning.port.js'

const REQUEST_TIMEOUT_MS = 10_000

@Injectable()
export class HttpAccountProvisioningAdapter extends IAccountProvisioningPort {
  private readonly logger = new Logger(HttpAccountProvisioningAdapter.name)

  constructor(private readonly config: ConfigService) {
    super()
  }

  async provision(input: ProvisionAccountInput): Promise<ProvisionedAccount> {
    const response = await this.call('POST', '/accounts', input)
    const body = (await response.json().catch(() => null)) as {
      data?: { id?: string }
    } | null

    const id = body?.data?.id
    if (!id) {
      this.logger.error(
        'identity-service answered provision with no account id',
      )
      throw new ServiceUnavailableException(
        'The identity service did not return a new account, so this application cannot be registered.',
      )
    }

    return { id }
  }

  async deprovision(userId: string): Promise<void> {
    await this.call('DELETE', `/accounts/${userId}`)
  }

  async lookup(identifier: string): Promise<AccountLookupResult> {
    const params = new URLSearchParams({ identifier })
    const response = await this.call('GET', `/accounts/lookup?${params}`)
    const body = (await response.json().catch(() => null)) as {
      data?: AccountLookupResult
    } | null

    return body?.data ?? { identifierTaken: false }
  }

  async findSummary(userId: string): Promise<AccountSummary | null> {
    const base = this.config.get<string>('IDENTITY_SERVICE_URL')
    if (!base) {
      throw new ServiceUnavailableException(
        'IDENTITY_SERVICE_URL is not configured, so the applicant account cannot be resolved.',
      )
    }
    const token = this.config.get<string>('PROVISIONING_SERVICE_TOKEN')
    if (!token) {
      throw new ServiceUnavailableException(
        'PROVISIONING_SERVICE_TOKEN is not configured, so the applicant account cannot be resolved.',
      )
    }

    let response: Response
    try {
      response = await fetch(`${base.replace(/\/+$/, '')}/accounts/${userId}`, {
        method: 'GET',
        headers: { 'x-provisioning-token': token },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (cause) {
      this.logger.error(
        `identity-service unreachable at ${base}: ${String(cause)}`,
      )
      throw new ServiceUnavailableException(
        'The identity service could not be reached, so the applicant account cannot be resolved.',
      )
    }

    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      this.logger.error(
        `identity-service answered ${response.status} for /accounts/${userId}`,
      )
      throw new ServiceUnavailableException(
        'The identity service could not resolve the applicant account.',
      )
    }

    const body = (await response.json().catch(() => null)) as {
      data?: AccountSummary
    } | null
    if (!body?.data) return null

    return {
      ...body.data,
      lastLoginAt: body.data.lastLoginAt
        ? new Date(body.data.lastLoginAt)
        : null,
    }
  }

  private async call(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const base = this.config.get<string>('IDENTITY_SERVICE_URL')
    if (!base) {
      throw new ServiceUnavailableException(
        'IDENTITY_SERVICE_URL is not configured, so no account can be provisioned.',
      )
    }

    const token = this.config.get<string>('PROVISIONING_SERVICE_TOKEN')
    if (!token) {
      throw new ServiceUnavailableException(
        'PROVISIONING_SERVICE_TOKEN is not configured, so no account can be provisioned.',
      )
    }

    let response: Response
    try {
      response = await fetch(`${base.replace(/\/+$/, '')}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-provisioning-token': token,
        },
        ...(body !== undefined && { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (cause) {
      this.logger.error(
        `identity-service unreachable at ${base}: ${String(cause)}`,
      )
      throw new ServiceUnavailableException(
        'The identity service could not be reached, so this account change cannot be made.',
      )
    }

    if (response.status === 409) {
      throw new ConflictException(
        'identity-service already holds an account with this identifier.',
      )
    }

    if (!response.ok) {
      this.logger.error(
        `identity-service answered ${response.status} for ${path}`,
      )
      throw new ServiceUnavailableException(
        'The identity service could not complete this account change.',
      )
    }

    return response
  }
}
