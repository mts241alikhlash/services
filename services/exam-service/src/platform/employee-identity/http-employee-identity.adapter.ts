import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import { IEmployeeIdentityReadPort } from './employee-identity.port.js'

const URL_KEY = 'HR_SERVICE_URL'

@Injectable()
export class HttpEmployeeIdentityAdapter extends IEmployeeIdentityReadPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async findEmployeeIdByUserId(userId: string): Promise<string | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/employees/by-user/${encodeURIComponent(userId)}`,
    )
    const employeeId = field(data, 'employeeId')
    if (employeeId === null) return null
    if (typeof employeeId === 'string') return employeeId
    return this.client.malformed(URL_KEY)
  }

  async employeeExists(id: string): Promise<boolean> {
    const data = await this.client.getData(
      URL_KEY,
      `/employees/${encodeURIComponent(id)}/exists`,
    )
    const exists = field(data, 'exists')
    if (typeof exists === 'boolean') return exists
    return this.client.malformed(URL_KEY)
  }
}

function field(data: unknown, key: string): unknown {
  return data !== null && typeof data === 'object' && key in data
    ? (data as Record<string, unknown>)[key]
    : undefined
}
