import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  ClassroomEnrollmentCount,
  EnrollmentSearch,
  EnrollmentSummary,
  IEnrollmentLookupPort,
} from './enrollment-lookup.port.js'

const URL_KEY = 'STUDENT_SERVICE_URL'

@Injectable()
export class HttpEnrollmentLookupAdapter extends IEnrollmentLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async findSummary(id: string): Promise<EnrollmentSummary | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/student-enrollments/summary/${encodeURIComponent(id)}`,
    )
    if (data === null) return null
    if (isSummary(data)) return data
    return this.client.malformed(URL_KEY)
  }

  async findActiveByStudent(
    studentId: string,
    semesterId?: string,
  ): Promise<EnrollmentSummary | null> {
    const query = semesterId
      ? `?semesterId=${encodeURIComponent(semesterId)}`
      : ''
    const data = await this.client.getData(
      URL_KEY,
      `/student-enrollments/active/${encodeURIComponent(studentId)}${query}`,
    )
    if (data === null) return null
    if (isSummary(data)) return data
    return this.client.malformed(URL_KEY)
  }

  async search(query: EnrollmentSearch): Promise<EnrollmentSummary[]> {
    const data = await this.client.postData(
      URL_KEY,
      '/student-enrollments/search',
      query,
    )
    if (Array.isArray(data) && data.every(isSummary)) return data
    return this.client.malformed(URL_KEY)
  }

  async countByClassrooms(
    classroomIds: string[],
    semesterId: string,
  ): Promise<ClassroomEnrollmentCount[]> {
    if (classroomIds.length === 0) return []

    const data = await this.client.postData(
      URL_KEY,
      '/student-enrollments/count-by-classrooms',
      { classroomIds, semesterId },
    )
    if (Array.isArray(data) && data.every(isClassroomCount)) return data
    return this.client.malformed(URL_KEY)
  }

  async listByClassroom(
    classroomId: string,
    semesterId?: string,
    limit?: number,
  ): Promise<EnrollmentSummary[]> {
    const params = new URLSearchParams()
    if (semesterId) params.set('semesterId', semesterId)
    if (limit) params.set('limit', String(limit))
    const query = params.toString()

    return this.list(
      `/student-enrollments/by-classroom/${encodeURIComponent(classroomId)}${
        query ? '?' + query : ''
      }`,
    )
  }

  async listByIds(ids: string[]): Promise<EnrollmentSummary[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(
      URL_KEY,
      '/student-enrollments/by-ids',
      { ids },
    )
    if (Array.isArray(data) && data.every(isSummary)) return data
    return this.client.malformed(URL_KEY)
  }

  async countActive(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0

    const data = await this.client.postData(
      URL_KEY,
      '/student-enrollments/count-active',
      { ids },
    )
    if (data !== null && typeof data === 'object' && 'count' in data) {
      const count = (data as Record<string, unknown>).count
      if (typeof count === 'number') return count
    }
    return this.client.malformed(URL_KEY)
  }

  private async list(path: string): Promise<EnrollmentSummary[]> {
    const data = await this.client.getData(URL_KEY, path)
    if (Array.isArray(data) && data.every(isSummary)) return data
    return this.client.malformed(URL_KEY)
  }
}

function isClassroomCount(row: unknown): row is ClassroomEnrollmentCount {
  if (row === null || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return typeof r.classroomId === 'string' && typeof r.count === 'number'
}

function isSummary(row: unknown): row is EnrollmentSummary {
  if (row === null || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return (
    typeof r.id === 'string' &&
    typeof r.studentId === 'string' &&
    typeof r.classroomId === 'string' &&
    typeof r.semesterId === 'string'
  )
}
