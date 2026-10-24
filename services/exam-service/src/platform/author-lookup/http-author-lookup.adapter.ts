import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import { IAuthorLookupPort } from './author-lookup.port.js'

const MAX_BATCH = 200

@Injectable()
export class HttpAuthorLookupAdapter extends IAuthorLookupPort {
  private readonly logger = new Logger(HttpAuthorLookupAdapter.name)

  constructor(private readonly client: ServiceClient) {
    super()
  }

  async namesOf(employeeIds: string[]): Promise<Map<string, string>> {
    const ids = [...new Set(employeeIds)].slice(0, MAX_BATCH)
    if (ids.length === 0) return new Map()

    try {
      const employees = await this.rows('HR_SERVICE_URL', '/employees/by-ids', {
        ids,
      })
      const accounts = new Map<string, string>()
      for (const row of employees) {
        if (typeof row.id === 'string' && typeof row.userId === 'string') {
          accounts.set(row.id, row.userId)
        }
      }

      const profiles = await this.rows(
        'IDENTITY_SERVICE_URL',
        '/profiles/batch',
        { userIds: [...new Set(accounts.values())] },
      )
      const names = new Map<string, string>()
      for (const row of profiles) {
        if (typeof row.userId === 'string' && typeof row.name === 'string') {
          names.set(row.userId, row.name)
        }
      }

      const result = new Map<string, string>()
      for (const [employeeId, userId] of accounts) {
        const name = names.get(userId)
        if (name !== undefined) result.set(employeeId, name)
      }
      return result
    } catch (error) {
      if (!(error instanceof ServiceUnavailableException)) throw error
      this.logger.warn(`Author names unavailable: ${error.message}`)
      return new Map()
    }
  }

  private async rows(
    urlKey: string,
    path: string,
    body: unknown,
  ): Promise<Record<string, unknown>[]> {
    const data = await this.client.postData(urlKey, path, body)
    if (!Array.isArray(data)) return this.client.malformed(urlKey)
    return data.filter(
      (row): row is Record<string, unknown> =>
        row !== null && typeof row === 'object',
    )
  }
}
