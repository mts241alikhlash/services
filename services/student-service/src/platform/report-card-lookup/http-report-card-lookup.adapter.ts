import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  IReportCardLookupPort,
  ReportCardAverage,
} from './report-card-lookup.port.js'

const URL_KEY = 'ASSESSMENT_SERVICE_URL'

@Injectable()
export class HttpReportCardLookupAdapter extends IReportCardLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async findAveragesByEnrollmentIds(
    enrollmentIds: string[],
  ): Promise<ReportCardAverage[]> {
    if (enrollmentIds.length === 0) return []

    const data = await this.client.postData(URL_KEY, '/report-cards/averages', {
      enrollmentIds,
    })

    if (Array.isArray(data)) {
      const rows: ReportCardAverage[] = []
      for (const row of data) {
        if (
          row === null ||
          typeof row !== 'object' ||
          typeof (row as Record<string, unknown>).enrollmentId !== 'string'
        ) {
          return this.client.malformed(URL_KEY)
        }
        const record = row as Record<string, unknown>
        rows.push({
          enrollmentId: record.enrollmentId as string,
          totalAverage:
            typeof record.totalAverage === 'number'
              ? record.totalAverage
              : null,
        })
      }
      return rows
    }
    return this.client.malformed(URL_KEY)
  }
}
