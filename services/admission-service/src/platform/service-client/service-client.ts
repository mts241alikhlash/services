import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

const REQUEST_TIMEOUT_MS = 10_000

@Injectable()
export class ServiceClient {
  private readonly logger = new Logger(ServiceClient.name)

  constructor(private readonly config: ConfigService) {}

  async getData(urlKey: string, path: string): Promise<unknown> {
    return this.request(urlKey, path, { method: 'GET' })
  }

  private async request(
    urlKey: string,
    path: string,
    init: { method: string; headers?: Record<string, string>; body?: string },
  ): Promise<unknown> {
    const service = urlKey.replace('_SERVICE_URL', '').toLowerCase()

    const base = this.config.get<string>(urlKey)
    if (!base) {
      throw new ServiceUnavailableException(
        `${urlKey} is not configured, so ${service}-service cannot be asked.`,
      )
    }

    const token = this.config.get<string>('PROVISIONING_SERVICE_TOKEN')
    if (!token) {
      throw new ServiceUnavailableException(
        'PROVISIONING_SERVICE_TOKEN is not configured, so no service can be asked.',
      )
    }

    let response: Response
    try {
      response = await fetch(`${base.replace(/\/+$/, '')}${path}`, {
        ...init,
        headers: { ...init.headers, 'x-provisioning-token': token },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        redirect: 'error',
      })
    } catch (cause) {
      this.logger.error(
        `${service}-service unreachable at ${base}: ${String(cause)}`,
      )
      throw new ServiceUnavailableException(
        `The ${service} service could not be reached, so this request cannot be answered.`,
      )
    }

    if (!response.ok) {
      this.logger.error(
        `${service}-service answered ${response.status} for ${path}`,
      )
      throw new ServiceUnavailableException(
        `The ${service} service could not answer, so this request cannot be answered.`,
      )
    }

    const body: unknown = await response.json().catch(() => null)
    if (body !== null && typeof body === 'object' && 'data' in body) {
      return body.data
    }
    return undefined
  }

  async postData(
    urlKey: string,
    path: string,
    body: unknown,
  ): Promise<unknown> {
    return this.request(urlKey, path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  malformed(urlKey: string): never {
    const service = urlKey.replace('_SERVICE_URL', '').toLowerCase()
    this.logger.error(`${service}-service returned a malformed response`)
    throw new ServiceUnavailableException(
      `The ${service} service returned an invalid response.`,
    )
  }
}
