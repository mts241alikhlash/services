import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  AcademicYearSummary,
  ClassroomContext,
  ClassroomDetail,
  ClassroomSummary,
  GradeLevelRef,
  EducationSummary,
  GradeSummary,
  IAcademicLookupPort,
  OccupationSummary,
  SemesterContext,
} from './academic-lookup.port.js'

const URL_KEY = 'ACADEMIC_SERVICE_URL'

@Injectable()
export class HttpAcademicLookupAdapter extends IAcademicLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async findActiveAcademicYear(): Promise<AcademicYearSummary | null> {
    const data = await this.client.getData(URL_KEY, '/academic-years/active')
    if (data === null) return null
    if (isRecord(data) && str(data.id) && str(data.name)) {
      return { id: data.id, name: data.name }
    }
    return this.client.malformed(URL_KEY)
  }

  async findActiveSemester(): Promise<SemesterContext | null> {
    return this.semester('/semesters/active')
  }

  async findSemesterContext(id: string): Promise<SemesterContext | null> {
    return this.semester(`/semesters/${encodeURIComponent(id)}/context`)
  }

  async listSemestersByAcademicYear(
    academicYearId: string,
  ): Promise<SemesterContext[]> {
    const data = await this.client.getData(
      URL_KEY,
      `/semesters/by-academic-year/${encodeURIComponent(academicYearId)}`,
    )
    if (Array.isArray(data)) {
      const rows: SemesterContext[] = []
      for (const row of data) {
        const parsed = toSemester(row)
        if (!parsed) return this.client.malformed(URL_KEY)
        rows.push(parsed)
      }
      return rows
    }
    return this.client.malformed(URL_KEY)
  }

  async findAcademicYear(id: string): Promise<AcademicYearSummary | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/academic-years/${encodeURIComponent(id)}/summary`,
    )
    if (data === null) return null
    if (isRecord(data) && str(data.id) && str(data.name)) {
      return { id: data.id, name: data.name }
    }
    return this.client.malformed(URL_KEY)
  }

  async listAcademicYears(ids: string[]): Promise<AcademicYearSummary[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(URL_KEY, '/academic-years/by-ids', {
      ids,
    })
    if (Array.isArray(data)) {
      const rows: AcademicYearSummary[] = []
      for (const row of data) {
        if (!isRecord(row) || !str(row.id) || !str(row.name)) {
          return this.client.malformed(URL_KEY)
        }
        rows.push({ id: row.id, name: row.name })
      }
      return rows
    }
    return this.client.malformed(URL_KEY)
  }

  async findClassroomDetail(id: string): Promise<ClassroomDetail | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/classrooms/${encodeURIComponent(id)}/detail`,
    )
    if (data === null) return null
    const parsed = toDetail(data)
    if (parsed) return parsed
    return this.client.malformed(URL_KEY)
  }

  async listClassroomsByAcademicYear(
    academicYearId: string,
  ): Promise<ClassroomDetail[]> {
    const data = await this.client.getData(
      URL_KEY,
      `/classrooms/by-academic-year/${encodeURIComponent(academicYearId)}`,
    )
    if (Array.isArray(data)) {
      const rows: ClassroomDetail[] = []
      for (const row of data) {
        const parsed = toDetail(row)
        if (!parsed) return this.client.malformed(URL_KEY)
        rows.push(parsed)
      }
      return rows
    }
    return this.client.malformed(URL_KEY)
  }

  async listClassroomsByIds(ids: string[]): Promise<ClassroomDetail[]> {
    return this.batch(ids, '/classrooms/by-ids', toDetail)
  }

  async listSemestersByIds(ids: string[]): Promise<SemesterContext[]> {
    return this.batch(ids, '/semesters/by-ids', toSemester)
  }

  async listGradesByIds(ids: string[]): Promise<GradeSummary[]> {
    return this.batch(ids, '/grades/by-ids', toGrade)
  }

  async findClassroom(id: string): Promise<ClassroomSummary | null> {
    return this.classroom(`/classrooms/${encodeURIComponent(id)}/summary`)
  }

  async findClassroomByCode(code: string): Promise<ClassroomSummary | null> {
    return this.classroom(`/classrooms/by-code/${encodeURIComponent(code)}`)
  }

  async listClassroomCodes(): Promise<string[]> {
    const data = await this.client.getData(URL_KEY, '/classrooms/codes')
    if (Array.isArray(data) && data.every(str)) return data
    return this.client.malformed(URL_KEY)
  }

  async listGradeLevels(): Promise<number[]> {
    const data = await this.client.getData(URL_KEY, '/grades/levels')
    if (Array.isArray(data) && data.every(num)) return data
    return this.client.malformed(URL_KEY)
  }

  async findGradeByLevel(level: number): Promise<GradeSummary | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/grades/by-level/${encodeURIComponent(String(level))}`,
    )
    if (data === null) return null
    const parsed = toGrade(data)
    if (parsed) return parsed
    return this.client.malformed(URL_KEY)
  }

  async listGradeLevelsForYear(
    academicYearId: string,
  ): Promise<GradeLevelRef[]> {
    const data = await this.client.getData(
      URL_KEY,
      `/classrooms/grade-levels?academicYearId=${encodeURIComponent(academicYearId)}`,
    )
    if (Array.isArray(data)) {
      const rows: GradeLevelRef[] = []
      for (const row of data) {
        if (!isRecord(row) || !num(row.level)) {
          return this.client.malformed(URL_KEY)
        }
        rows.push({ level: row.level, name: nullableStr(row.name) })
      }
      return rows
    }
    return this.client.malformed(URL_KEY)
  }

  async findClassroomContext(
    classroomId: string,
    semesterId?: string,
    subjectLimit?: number,
  ): Promise<ClassroomContext | null> {
    const params = new URLSearchParams()
    if (semesterId) params.set('semesterId', semesterId)
    if (subjectLimit) params.set('subjectLimit', String(subjectLimit))
    const query = params.toString()

    const data = await this.client.getData(
      URL_KEY,
      `/classrooms/${encodeURIComponent(classroomId)}/context${
        query ? '?' + query : ''
      }`,
    )
    if (data === null) return null
    if (isRecord(data) && 'classroom' in data && Array.isArray(data.subjects)) {
      return {
        classroom: data.classroom,
        structure: data.structure ?? null,
        supervisor: data.supervisor ?? null,
        subjects: data.subjects,
      }
    }
    return this.client.malformed(URL_KEY)
  }

  async findOccupation(id: string): Promise<OccupationSummary | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/occupations/${encodeURIComponent(id)}/summary`,
    )
    if (data === null) return null
    const parsed = toOccupation(data)
    if (parsed) return parsed
    return this.client.malformed(URL_KEY)
  }

  async listOccupationsByIds(ids: string[]): Promise<OccupationSummary[]> {
    return this.batch(ids, '/occupations/by-ids', toOccupation)
  }

  async listEducationsByIds(ids: string[]): Promise<EducationSummary[]> {
    return this.batch(ids, '/educations/by-ids', toEducation)
  }

  private async batch<T>(
    ids: string[],
    path: string,
    parse: (row: unknown) => T | null,
  ): Promise<T[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(URL_KEY, path, { ids })
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    const rows: T[] = []
    for (const row of data) {
      const parsed = parse(row)
      if (!parsed) return this.client.malformed(URL_KEY)
      rows.push(parsed)
    }
    return rows
  }

  private async semester(path: string): Promise<SemesterContext | null> {
    const data = await this.client.getData(URL_KEY, path)
    if (data === null) return null
    const parsed = toSemester(data)
    if (parsed) return parsed
    return this.client.malformed(URL_KEY)
  }

  private async classroom(path: string): Promise<ClassroomSummary | null> {
    const data = await this.client.getData(URL_KEY, path)
    if (data === null) return null
    if (isRecord(data) && str(data.id) && str(data.code)) {
      return { id: data.id, code: data.code, name: nullableStr(data.name) }
    }
    return this.client.malformed(URL_KEY)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function str(value: unknown): value is string {
  return typeof value === 'string'
}

function num(value: unknown): value is number {
  return typeof value === 'number'
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toSemester(row: unknown): SemesterContext | null {
  if (!isRecord(row) || !str(row.id) || !str(row.academicYearId)) return null
  return {
    id: row.id,
    academicYearId: row.academicYearId,
    academicYearName: nullableStr(row.academicYearName),
    typeId: nullableStr(row.typeId),
    typeName: nullableStr(row.typeName),
    isActive: row.isActive === true,
    sequence: num(row.sequence) ? row.sequence : 0,
  }
}

function toOccupation(row: unknown): OccupationSummary | null {
  if (!isRecord(row) || !str(row.id) || !str(row.name)) return null
  return { id: row.id, name: row.name, isActive: row.isActive === true }
}

function toEducation(row: unknown): EducationSummary | null {
  if (!isRecord(row) || !str(row.id) || !str(row.name)) return null
  return { id: row.id, name: row.name }
}

function toGrade(row: unknown): GradeSummary | null {
  if (!isRecord(row) || !str(row.id) || !num(row.level)) return null
  return { id: row.id, level: row.level, name: nullableStr(row.name) }
}

function toDetail(row: unknown): ClassroomDetail | null {
  if (
    !isRecord(row) ||
    !str(row.id) ||
    !str(row.code) ||
    !str(row.gradeId) ||
    !str(row.academicYearId)
  ) {
    return null
  }
  return {
    id: row.id,
    code: row.code,
    name: nullableStr(row.name),
    gradeId: row.gradeId,
    academicYearId: row.academicYearId,
    capacity: num(row.capacity) ? row.capacity : 0,
    gradeLevel: num(row.gradeLevel) ? row.gradeLevel : null,
    gradeName: nullableStr(row.gradeName),
  }
}
