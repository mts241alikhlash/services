import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  IEnrollmentLookupPort,
  type ActiveEnrollment,
} from './enrollment-lookup.port.js'

const URL_KEY = 'STUDENT_SERVICE_URL'

@Injectable()
export class HttpEnrollmentLookupAdapter extends IEnrollmentLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async findActiveByStudent(
    studentId: string,
    semesterId?: string,
  ): Promise<ActiveEnrollment | null> {
    const query = semesterId
      ? `?semesterId=${encodeURIComponent(semesterId)}`
      : ''
    const data = await this.client.getData(
      URL_KEY,
      `/student-enrollments/active/${encodeURIComponent(studentId)}${query}`,
    )
    if (data === null || data === undefined) return null
    if (isEnrollment(data)) {
      return {
        id: data.id,
        studentId: data.studentId,
        classroomId: data.classroomId,
        semesterId: data.semesterId,
      }
    }
    return this.client.malformed(URL_KEY)
  }

  async listActiveByClassroom(
    classroomId: string,
    semesterId: string,
  ): Promise<ActiveEnrollment[]> {
    const data = await this.client.getData(
      URL_KEY,
      `/student-enrollments/by-classroom/${encodeURIComponent(classroomId)}?semesterId=${encodeURIComponent(semesterId)}&limit=500`,
    )
    const rows = Array.isArray(data)
      ? (data as unknown[])
      : data !== null &&
          typeof data === 'object' &&
          Array.isArray((data as { data?: unknown }).data)
        ? (data as { data: unknown[] }).data
        : this.client.malformed(URL_KEY)
    return rows.map((row) => {
      if (!isEnrollment(row)) return this.client.malformed(URL_KEY)
      return {
        id: row.id,
        studentId: row.studentId,
        classroomId: row.classroomId,
        semesterId: row.semesterId,
      }
    })
  }
}

function isEnrollment(row: unknown): row is ActiveEnrollment {
  if (row === null || typeof row !== 'object') return false
  const record = row as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.studentId === 'string' &&
    typeof record.classroomId === 'string' &&
    typeof record.semesterId === 'string'
  )
}
