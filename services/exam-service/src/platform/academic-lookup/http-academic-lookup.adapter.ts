import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  IAcademicLookupPort,
  type ActiveSemester,
  type ClassroomRef,
  type GradeRef,
  type TeachingPair,
} from './academic-lookup.port.js'

const URL_KEY = 'ACADEMIC_SERVICE_URL'

@Injectable()
export class HttpAcademicLookupAdapter extends IAcademicLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async teachingPairsOf(employeeId: string): Promise<TeachingPair[]> {
    const semester = await this.findActiveSemester()
    if (semester === null) return []
    const semesterId = semester.id

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
        typeof row.subjectName !== 'string' ||
        typeof row.classroomGradeId !== 'string'
      ) {
        return this.client.malformed(URL_KEY)
      }
      pairs.set(`${row.subjectId}:${row.classroomGradeId}`, {
        subjectId: row.subjectId,
        gradeId: row.classroomGradeId,
        subjectName: row.subjectName,
      })
    }
    return [...pairs.values()]
  }

  async classroomsByIds(ids: string[]): Promise<ClassroomRef[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(URL_KEY, '/classrooms/by-ids', {
      ids,
    })
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    return (data as unknown[]).map((row) => {
      if (
        !isRecord(row) ||
        typeof row.id !== 'string' ||
        typeof row.gradeId !== 'string' ||
        typeof row.academicYearId !== 'string'
      ) {
        return this.client.malformed(URL_KEY)
      }
      return {
        id: row.id,
        gradeId: row.gradeId,
        academicYearId: row.academicYearId,
        name: typeof row.name === 'string' ? row.name : null,
      }
    })
  }

  activeSemester(): Promise<ActiveSemester | null> {
    return this.findActiveSemester()
  }

  async gradesByIds(ids: string[]): Promise<GradeRef[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(URL_KEY, '/grades/by-ids', { ids })
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    return (data as unknown[]).map((row) => {
      if (
        !isRecord(row) ||
        typeof row.id !== 'string' ||
        typeof row.level !== 'number'
      ) {
        return this.client.malformed(URL_KEY)
      }
      return {
        id: row.id,
        level: row.level,
        name: typeof row.name === 'string' ? row.name : null,
      }
    })
  }

  private async findActiveSemester(): Promise<ActiveSemester | null> {
    const data = await this.client.getData(URL_KEY, '/semesters/active')
    if (data === null) return null
    if (
      isRecord(data) &&
      typeof data.id === 'string' &&
      typeof data.academicYearId === 'string'
    ) {
      return { id: data.id, academicYearId: data.academicYearId }
    }
    return this.client.malformed(URL_KEY)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}
