import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import { IAcademicLookupPort } from './academic-lookup.port.js'

const URL_KEY = 'ACADEMIC_SERVICE_URL'

@Injectable()
export class HttpAcademicLookupAdapter extends IAcademicLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async listEmployeeIdsForAcademicYear(
    academicYearId: string,
  ): Promise<string[]> {
    const data = await this.client.getData(
      URL_KEY,
      '/teaching-assignments/employee-ids' +
        `?academicYearId=${encodeURIComponent(academicYearId)}`,
    )
    if (Array.isArray(data) && data.every((id) => typeof id === 'string')) {
      return data
    }
    return this.client.malformed(URL_KEY)
  }
}
