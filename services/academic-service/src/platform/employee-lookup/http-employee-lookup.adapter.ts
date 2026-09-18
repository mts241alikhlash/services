import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import { IEmployeeLookupPort, EmployeeRef } from './employee-lookup.port.js'

const URL_KEY = 'HR_SERVICE_URL'

@Injectable()
export class HttpEmployeeLookupAdapter extends IEmployeeLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async listByIds(ids: string[]): Promise<EmployeeRef[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(URL_KEY, '/employees/by-ids', {
      ids: [...new Set(ids)],
    })
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    const rows: EmployeeRef[] = []
    for (const row of data) {
      const parsed = toEmployeeRef(row)
      if (!parsed) return this.client.malformed(URL_KEY)
      rows.push(parsed)
    }
    return rows
  }
}

function toEmployeeRef(row: unknown): EmployeeRef | null {
  if (row === null || typeof row !== 'object') return null
  const record = row as Record<string, unknown>
  if (typeof record.id !== 'string' || typeof record.userId !== 'string') {
    return null
  }
  return {
    id: record.id,
    userId: record.userId,
    nip: typeof record.nip === 'string' ? record.nip : null,
  }
}
