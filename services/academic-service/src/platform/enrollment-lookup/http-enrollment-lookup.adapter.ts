import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import { IEnrollmentLookupPort } from './enrollment-lookup.port.js'

const URL_KEY = 'STUDENT_SERVICE_URL'

@Injectable()
export class HttpEnrollmentLookupAdapter extends IEnrollmentLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async findActiveClassroomId(studentId: string): Promise<string | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/student-enrollments/active/${encodeURIComponent(studentId)}`,
    )
    if (data === null) return null

    const classroomId = field(data, 'classroomId')
    if (typeof classroomId === 'string') return classroomId
    return this.client.malformed(URL_KEY)
  }

  async countByClassroom(classroomId: string): Promise<number> {
    return this.count(
      `/student-enrollments/count-by-classroom/${encodeURIComponent(classroomId)}`,
    )
  }

  async countBySemester(semesterId: string): Promise<number> {
    return this.count(
      `/student-enrollments/count-by-semester/${encodeURIComponent(semesterId)}`,
    )
  }

  async countBySemesters(semesterIds: string[]): Promise<Map<string, number>> {
    if (semesterIds.length === 0) return new Map()

    const data = await this.client.postData(
      URL_KEY,
      '/student-enrollments/count-by-semesters',
      { semesterIds },
    )
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    const counts = new Map<string, number>()
    for (const row of data) {
      const semesterId = field(row, 'semesterId')
      const count = field(row, 'count')
      if (typeof semesterId !== 'string' || typeof count !== 'number') {
        return this.client.malformed(URL_KEY)
      }
      counts.set(semesterId, count)
    }
    return counts
  }

  async rolloverToSemester(
    sourceSemesterId: string,
    targetSemesterId: string,
    classroomIdMap: Map<string, string>,
  ): Promise<{ created: number; skipped: number }> {
    const data = await this.client.postData(
      URL_KEY,
      '/student-enrollments/rollover',
      {
        sourceSemesterId,
        targetSemesterId,
        classroomIdMap: Object.fromEntries(classroomIdMap),
      },
    )

    const created = field(data, 'created')
    const skipped = field(data, 'skipped')
    if (typeof created === 'number' && typeof skipped === 'number') {
      return { created, skipped }
    }
    return this.client.malformed(URL_KEY)
  }

  private async count(path: string): Promise<number> {
    const data = await this.client.getData(URL_KEY, path)
    const count = field(data, 'count')
    if (typeof count === 'number' && Number.isInteger(count) && count >= 0) {
      return count
    }
    return this.client.malformed(URL_KEY)
  }
}

function field(data: unknown, key: string): unknown {
  return data !== null && typeof data === 'object' && key in data
    ? (data as Record<string, unknown>)[key]
    : undefined
}
