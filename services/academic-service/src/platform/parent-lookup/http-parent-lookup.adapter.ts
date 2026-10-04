import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import { IParentLookupPort } from './parent-lookup.port.js'

const URL_KEY = 'STUDENT_SERVICE_URL'

@Injectable()
export class HttpParentLookupAdapter extends IParentLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async countByOccupation(occupationId: string): Promise<number> {
    const data = await this.client.getData(
      URL_KEY,
      `/parents/count-by-occupation/${encodeURIComponent(occupationId)}`,
    )
    const count =
      data !== null && typeof data === 'object' && 'count' in data
        ? (data as Record<string, unknown>).count
        : undefined

    if (typeof count === 'number' && Number.isInteger(count) && count >= 0) {
      return count
    }
    return this.client.malformed(URL_KEY)
  }
}
