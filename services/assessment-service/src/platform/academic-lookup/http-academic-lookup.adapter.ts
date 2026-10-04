import { Injectable } from '@nestjs/common'
import { ServiceClient } from '../service-client/service-client.js'
import {
  AcademicSettingSummary,
  ActiveSemester,
  ClassroomSummary,
  IAcademicLookupPort,
  PassingScoreQuery,
  ResolvedPassingScore,
  ScheduleRef,
  SemesterSummary,
  SupervisedClassroom,
  TeachingAssignmentDetail,
  TeachingLoad,
  TimetableLesson,
} from './academic-lookup.port.js'

const URL_KEY = 'ACADEMIC_SERVICE_URL'

@Injectable()
export class HttpAcademicLookupAdapter extends IAcademicLookupPort {
  constructor(private readonly client: ServiceClient) {
    super()
  }

  async findSetting(): Promise<AcademicSettingSummary | null> {
    const data = await this.client.getData(
      URL_KEY,
      '/academic-settings/summary',
    )
    if (data === null) return null
    if (
      isRecord(data) &&
      (data.defaultPassingScore === null ||
        typeof data.defaultPassingScore === 'number') &&
      Array.isArray(data.weeklyHolidays) &&
      data.weeklyHolidays.every((d: unknown) => typeof d === 'number')
    ) {
      return {
        defaultPassingScore: data.defaultPassingScore,
        weeklyHolidays: data.weeklyHolidays,
      }
    }
    return this.client.malformed(URL_KEY)
  }

  async findPassingScores(
    queries: PassingScoreQuery[],
  ): Promise<ResolvedPassingScore[]> {
    if (queries.length === 0) return []

    const data = await this.client.postData(
      URL_KEY,
      '/curriculum-subjects/passing-scores',
      { queries },
    )
    if (Array.isArray(data) && data.every(isResolvedPassingScore)) return data
    return this.client.malformed(URL_KEY)
  }

  async teachingAssignmentExists(id: string): Promise<boolean> {
    const data = await this.client.getData(
      URL_KEY,
      `/teaching-assignments/${encodeURIComponent(id)}/exists`,
    )
    if (isRecord(data) && typeof data.exists === 'boolean') return data.exists
    return this.client.malformed(URL_KEY)
  }

  async teachingAssignmentBelongsTo(
    id: string,
    employeeId: string,
  ): Promise<boolean> {
    const data = await this.client.getData(
      URL_KEY,
      `/teaching-assignments/${encodeURIComponent(id)}/exists` +
        `?employeeId=${encodeURIComponent(employeeId)}`,
    )
    if (isRecord(data) && typeof data.exists === 'boolean') return data.exists
    return this.client.malformed(URL_KEY)
  }

  async listTeachingAssignments(
    ids: string[],
  ): Promise<TeachingAssignmentDetail[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(
      URL_KEY,
      '/teaching-assignments/by-ids',
      { ids },
    )
    return this.parseList(data, toTeachingAssignment)
  }

  async listTeachingAssignmentsByEmployee(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingAssignmentDetail[]> {
    const data = await this.client.getData(
      URL_KEY,
      '/teaching-assignments/by-employee' +
        `?employeeId=${encodeURIComponent(employeeId)}` +
        `&semesterId=${encodeURIComponent(semesterId)}`,
    )
    return this.parseList(data, toTeachingAssignment)
  }

  async listSchedules(ids: string[]): Promise<ScheduleRef[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(URL_KEY, '/schedules/by-ids', {
      ids,
    })
    return this.parseList(data, toScheduleRef)
  }

  async summariseTeachingLoad(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingLoad> {
    const data = await this.client.getData(
      URL_KEY,
      '/teaching-assignments/load' +
        `?employeeId=${encodeURIComponent(employeeId)}` +
        `&semesterId=${encodeURIComponent(semesterId)}`,
    )
    if (
      isRecord(data) &&
      typeof data.classroomCount === 'number' &&
      typeof data.subjectCount === 'number'
    ) {
      return {
        classroomCount: data.classroomCount,
        subjectCount: data.subjectCount,
      }
    }
    return this.client.malformed(URL_KEY)
  }

  async supervisesClassroom(
    employeeId: string,
    classroomId: string,
    semesterId: string,
  ): Promise<boolean> {
    const data = await this.client.getData(
      URL_KEY,
      '/classrooms/supervises' +
        `?employeeId=${encodeURIComponent(employeeId)}` +
        `&classroomId=${encodeURIComponent(classroomId)}` +
        `&semesterId=${encodeURIComponent(semesterId)}`,
    )
    if (isRecord(data) && typeof data.supervises === 'boolean') {
      return data.supervises
    }
    return this.client.malformed(URL_KEY)
  }

  async listSupervisedClassrooms(
    employeeId: string,
    semesterId: string,
  ): Promise<SupervisedClassroom[]> {
    const data = await this.client.getData(
      URL_KEY,
      '/classrooms/supervised' +
        `?employeeId=${encodeURIComponent(employeeId)}` +
        `&semesterId=${encodeURIComponent(semesterId)}`,
    )
    return this.parseList(data, toSupervisedClassroom)
  }

  async listLessons(
    scope: { classroomId?: string; employeeId?: string },
    day: string,
  ): Promise<TimetableLesson[]> {
    const params = new URLSearchParams({ day })
    if (scope.classroomId) params.set('classroomId', scope.classroomId)
    if (scope.employeeId) params.set('employeeId', scope.employeeId)

    const data = await this.client.getData(
      URL_KEY,
      `/schedules/lessons?${params.toString()}`,
    )
    return this.parseList(data, toLesson)
  }

  async findActiveAcademicYearId(): Promise<string | null> {
    const data = await this.client.getData(URL_KEY, '/academic-years/active')
    if (data === null) return null
    if (isRecord(data) && typeof data.id === 'string') return data.id
    return this.client.malformed(URL_KEY)
  }

  async findActiveSemester(): Promise<ActiveSemester | null> {
    const data = await this.client.getData(URL_KEY, '/semesters/active')
    if (data === null) return null
    if (
      isRecord(data) &&
      typeof data.id === 'string' &&
      typeof data.academicYearId === 'string'
    ) {
      return {
        id: data.id,
        academicYearId: data.academicYearId,
        typeName: asNullableString(data.typeName),
      }
    }
    return this.client.malformed(URL_KEY)
  }

  async listClassrooms(ids: string[]): Promise<ClassroomSummary[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(URL_KEY, '/classrooms/by-ids', {
      ids,
    })
    return this.parseList(data, toClassroom)
  }

  async listSemesters(ids: string[]): Promise<SemesterSummary[]> {
    if (ids.length === 0) return []

    const data = await this.client.postData(URL_KEY, '/semesters/by-ids', {
      ids,
    })
    return this.parseList(data, toSemester)
  }

  private parseList<T>(data: unknown, parse: (row: unknown) => T | null): T[] {
    if (!Array.isArray(data)) return this.client.malformed(URL_KEY)

    const rows: T[] = []
    for (const row of data) {
      const parsed = parse(row)
      if (!parsed) return this.client.malformed(URL_KEY)
      rows.push(parsed)
    }
    return rows
  }

  async findSemester(id: string): Promise<SemesterSummary | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/semesters/${encodeURIComponent(id)}/summary`,
    )
    if (data === null) return null
    if (isRecord(data) && typeof data.id === 'string') {
      return {
        id: data.id,
        typeName: asNullableString(data.typeName),
        academicYearName: asNullableString(data.academicYearName),
      }
    }
    return this.client.malformed(URL_KEY)
  }

  async findClassroom(id: string): Promise<ClassroomSummary | null> {
    const data = await this.client.getData(
      URL_KEY,
      `/classrooms/${encodeURIComponent(id)}/summary`,
    )
    if (data === null) return null
    const parsed = toClassroom(data)
    if (parsed) return parsed
    return this.client.malformed(URL_KEY)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toTeachingAssignment(row: unknown): TeachingAssignmentDetail | null {
  if (
    !isRecord(row) ||
    typeof row.id !== 'string' ||
    typeof row.employeeId !== 'string' ||
    typeof row.classroomId !== 'string' ||
    typeof row.subjectId !== 'string' ||
    typeof row.semesterId !== 'string' ||
    typeof row.subjectName !== 'string' ||
    typeof row.classroomCode !== 'string' ||
    typeof row.classroomGradeId !== 'string' ||
    typeof row.classroomAcademicYearId !== 'string'
  ) {
    return null
  }
  return {
    id: row.id,
    employeeId: row.employeeId,
    classroomId: row.classroomId,
    subjectId: row.subjectId,
    semesterId: row.semesterId,
    subjectCode: asNullableString(row.subjectCode),
    subjectName: row.subjectName,
    classroomCode: row.classroomCode,
    classroomName: asNullableString(row.classroomName),
    classroomGradeId: row.classroomGradeId,
    classroomAcademicYearId: row.classroomAcademicYearId,
    passingScore:
      typeof row.passingScore === 'number' ? row.passingScore : null,
    employeeUserId: asNullableString(row.employeeUserId),
  }
}

function toScheduleRef(row: unknown): ScheduleRef | null {
  if (
    !isRecord(row) ||
    typeof row.id !== 'string' ||
    typeof row.teachingAssignmentId !== 'string' ||
    typeof row.timeSlotId !== 'string'
  ) {
    return null
  }
  return {
    id: row.id,
    teachingAssignmentId: row.teachingAssignmentId,
    timeSlotId: row.timeSlotId,
  }
}

function toSupervisedClassroom(row: unknown): SupervisedClassroom | null {
  if (!isRecord(row) || typeof row.id !== 'string') return null
  if (typeof row.code !== 'string') return null
  return { id: row.id, code: row.code, name: asNullableString(row.name) }
}

function toClassroom(row: unknown): ClassroomSummary | null {
  if (!isRecord(row) || typeof row.id !== 'string') return null
  return {
    id: row.id,
    code: asNullableString(row.code),
    name: asNullableString(row.name),
  }
}

function toSemester(row: unknown): SemesterSummary | null {
  if (!isRecord(row) || typeof row.id !== 'string') return null
  return {
    id: row.id,
    typeName: asNullableString(row.typeName),
    academicYearName: asNullableString(row.academicYearName),
  }
}

function toLesson(row: unknown): TimetableLesson | null {
  if (
    !isRecord(row) ||
    typeof row.id !== 'string' ||
    typeof row.startTime !== 'string' ||
    typeof row.endTime !== 'string' ||
    typeof row.order !== 'number' ||
    typeof row.subjectName !== 'string' ||
    typeof row.classroomCode !== 'string'
  ) {
    return null
  }
  return {
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    order: row.order,
    subjectName: row.subjectName,
    classroomCode: row.classroomCode,
    employeeUserId: asNullableString(row.employeeUserId),
    room: asNullableString(row.room),
  }
}

function isResolvedPassingScore(row: unknown): row is ResolvedPassingScore {
  if (!isRecord(row)) return false
  return (
    typeof row.gradeId === 'string' &&
    typeof row.academicYearId === 'string' &&
    typeof row.subjectId === 'string' &&
    typeof row.passingScore === 'number'
  )
}
