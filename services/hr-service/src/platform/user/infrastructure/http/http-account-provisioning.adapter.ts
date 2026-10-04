import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  AccountLookupInput,
  AccountLookupResult,
  AccountProfile,
  AccountRecord,
  IAccountProvisioningPort,
  ProvisionAccountInput,
  ProvisionedAccount,
  UpdateAccountProfileInput,
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
        'The identity service did not return a new account, so this record cannot be created.',
      )
    }

    return { id }
  }

  async deprovision(userId: string): Promise<void> {
    await this.call('DELETE', `/accounts/${userId}`)
  }

  async setActive(userId: string, isActive: boolean): Promise<AccountRecord> {
    const response = await this.call('PATCH', `/accounts/${userId}`, {
      isActive,
    })
    const body = (await response.json().catch(() => null)) as {
      data?: AccountRecord
    } | null

    if (!body?.data) {
      this.logger.error('identity-service answered setActive with no body')
      throw new ServiceUnavailableException(
        'The identity service did not return the updated account.',
      )
    }

    return {
      ...body.data,
      createdAt: new Date(body.data.createdAt),
      updatedAt: new Date(body.data.updatedAt),
    }
  }

  async updateProfile(
    userId: string,
    data: UpdateAccountProfileInput,
  ): Promise<AccountProfile> {
    const response = await this.call('PATCH', `/accounts/${userId}/profile`, {
      ...data,
      ...(data.birthDate && {
        birthDate: data.birthDate.toISOString().slice(0, 10),
      }),
    })
    const body = (await response.json().catch(() => null)) as {
      data?: AccountProfile
    } | null

    if (!body?.data) {
      this.logger.error('identity-service answered profile update with no body')
      throw new ServiceUnavailableException(
        'The identity service did not return the updated profile.',
      )
    }

    return { ...body.data, birthDate: new Date(body.data.birthDate) }
  }

  async lookup(input: AccountLookupInput): Promise<AccountLookupResult> {
    const params = new URLSearchParams()
    if (input.identifier) params.set('identifier', input.identifier)
    if (input.nik) params.set('nik', input.nik)

    const response = await this.call('GET', `/accounts/lookup?${params}`)
    const body = (await response.json().catch(() => null)) as {
      data?: AccountLookupResult
    } | null

    return body?.data ?? { identifierTaken: false, nikOwnerId: null }
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
        'identity-service already holds an account or profile with this identifier or NIK.',
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
