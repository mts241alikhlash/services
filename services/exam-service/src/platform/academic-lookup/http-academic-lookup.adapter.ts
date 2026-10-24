import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  IAcademicLookupPort,
  type TeachingPair,
} from './academic-lookup.port.js'

const URL_KEY = 'ACADEMIC_SERVICE_URL'

@Injectable()
export class HttpAcademicLookupAdapter extends IAcademicLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async teachingPairsOf(employeeId: string): Promise<TeachingPair[]> {
    const semesterId = await this.findActiveSemesterId()
    if (semesterId === null) return []

    const data = await this.client.getData(
      URL_KEY,
      '/teaching-assignments/by-employee' +
        `?employeeId=${encodeURIComponent(employeeId)}` +
        `&semesterId=${encodeURIComponent(semesterId)}`,
    )
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    const pairs = new Map<string, TeachingPair>()
    for (const row of data as unknown[]) {
      if (
        !isRecord(row) ||
        typeof row.subjectId !== 'string' ||
        typeof row.classroomGradeId !== 'string'
      ) {
        return this.client.malformed(URL_KEY)
      }
      pairs.set(`${row.subjectId}:${row.classroomGradeId}`, {
        subjectId: row.subjectId,
        gradeId: row.classroomGradeId,
      })
    }
    return [...pairs.values()]
  }

  private async findActiveSemesterId(): Promise<string | null> {
    const data = await this.client.getData(URL_KEY, '/semesters/active')
    if (data === null) return null
    if (isRecord(data) && typeof data.id === 'string') return data.id
    return this.client.malformed(URL_KEY)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}
