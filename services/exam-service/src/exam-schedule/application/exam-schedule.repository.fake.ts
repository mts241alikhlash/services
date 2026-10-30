import { randomUUID } from 'node:crypto'
import type { FakeExamPackageRepository } from '../../exam-package/application/exam-package.repository.fake.js'
import type { ExamSchedule } from '../domain/entities/exam-schedule.entity.js'
import type {
  NewParticipant,
  ScheduleParticipant,
} from '../domain/entities/schedule-participant.entity.js'
import {
  IExamScheduleRepository,
  type ExamScheduleGradingQuery,
  type ExamScheduleListQuery,
  type NewExamSchedule,
  type NewMakeupSchedule,
  type ScheduleWindowFields,
} from '../domain/repositories/exam-schedule.repository.js'

export class FakeExamScheduleRepository extends IExamScheduleRepository {
  readonly schedules = new Map<string, ExamSchedule>()
  readonly participants = new Map<string, ScheduleParticipant[]>()
  withSessions: (scheduleId: string) => boolean = () => true

  constructor(private readonly packages: FakeExamPackageRepository) {
    super()
  }

  findAll(query: ExamScheduleListQuery) {
    const rows = [...this.schedules.values()]
      .filter(
        (row) => !query.classroomId || row.classroomId === query.classroomId,
      )
      .filter((row) => !query.packageId || row.packageId === query.packageId)
      .filter((row) => !query.status || row.status === query.status)
      .filter((row) => !query.from || row.endsAt >= query.from)
      .filter((row) => !query.to || row.startsAt <= query.to)
    return Promise.resolve({
      data: rows.slice(
        (query.page - 1) * query.limit,
        query.page * query.limit,
      ),
      total: rows.length,
      page: query.page,
      limit: query.limit,
    })
  }

  findForGrading(query: ExamScheduleGradingQuery) {
    const rows = [...this.schedules.values()]
      .filter((row) => row.semesterId === query.semesterId)
      .filter(
        (row) =>
          this.withSessions(row.id) ||
          row.kind === 'MAKEUP' ||
          row.endsAt <= query.now,
      )
      .filter(
        (row) =>
          query.pairs === null ||
          query.pairs.some(
            (pair) =>
              pair.subjectId === row.subjectId &&
              pair.classroomId === row.classroomId,
          ),
      )
      .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    return Promise.resolve({
      data: rows.slice(
        (query.page - 1) * query.limit,
        query.page * query.limit,
      ),
      total: rows.length,
      page: query.page,
      limit: query.limit,
    })
  }

  findForClassroom(classroomId: string, semesterId: string) {
    return Promise.resolve(
      [...this.schedules.values()].filter(
        (row) =>
          row.classroomId === classroomId &&
          row.semesterId === semesterId &&
          row.kind === 'REGULAR' &&
          row.status === 'SCHEDULED',
      ),
    )
  }

  findById(id: string) {
    return Promise.resolve(this.schedules.get(id) ?? null)
  }

  async createAndLockPackage(input: NewExamSchedule) {
    const pkg = await this.packages.findById(input.packageId)
    if (pkg === null) return null
    const now = new Date()
    const row: ExamSchedule = {
      id: randomUUID(),
      packageId: input.packageId,
      packageTitle: pkg.title,
      subjectId: pkg.subjectId,
      classroomId: input.classroomId,
      semesterId: input.semesterId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      durationMinutes: input.durationMinutes,
      type: input.type,
      kind: 'REGULAR',
      makeupOfId: null,
      tokenRotation: 0,
      status: 'SCHEDULED',
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
    }
    this.schedules.set(row.id, row)
    this.packages.lockForTest(input.packageId)
    return row
  }

  async createMakeup(input: NewMakeupSchedule) {
    const pkg = await this.packages.findById(input.packageId)
    if (pkg === null) return null
    if (pkg.status !== 'APPROVED' && pkg.status !== 'LOCKED') return null
    const now = new Date()
    const row: ExamSchedule = {
      id: randomUUID(),
      packageId: input.packageId,
      packageTitle: pkg.title,
      subjectId: pkg.subjectId,
      classroomId: input.classroomId,
      semesterId: input.semesterId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      durationMinutes: input.durationMinutes,
      type: input.type,
      kind: 'MAKEUP',
      makeupOfId: input.makeupOfId,
      tokenRotation: 0,
      status: 'SCHEDULED',
      createdById: input.createdById,
      createdAt: now,
      updatedAt: now,
    }
    this.schedules.set(row.id, row)
    this.packages.lockForTest(input.packageId)
    this.participants.set(
      row.id,
      input.participants.map((participant) => ({
        scheduleId: row.id,
        ...participant,
        addedById: input.createdById,
        createdAt: now,
      })),
    )
    return row
  }

  listParticipants(scheduleId: string) {
    return Promise.resolve([...(this.participants.get(scheduleId) ?? [])])
  }

  addParticipants(
    scheduleId: string,
    rows: NewParticipant[],
    addedById: string,
  ) {
    const current = this.participants.get(scheduleId) ?? []
    for (const row of rows) {
      if (current.some((existing) => existing.studentId === row.studentId)) {
        return Promise.reject(new Error('duplicate participant'))
      }
    }
    this.participants.set(scheduleId, [
      ...current,
      ...rows.map((row) => ({
        scheduleId,
        ...row,
        addedById,
        createdAt: new Date(),
      })),
    ])
    return Promise.resolve()
  }

  removeParticipant(scheduleId: string, studentId: string) {
    const current = this.participants.get(scheduleId) ?? []
    const next = current.filter((row) => row.studentId !== studentId)
    this.participants.set(scheduleId, next)
    return Promise.resolve(next.length !== current.length)
  }

  findParticipation(scheduleId: string, studentId: string) {
    return Promise.resolve(
      (this.participants.get(scheduleId) ?? []).find(
        (row) => row.studentId === studentId,
      ) ?? null,
    )
  }

  findMakeupsOf(originalId: string) {
    return Promise.resolve(
      [...this.schedules.values()].filter(
        (row) => row.kind === 'MAKEUP' && row.makeupOfId === originalId,
      ),
    )
  }

  findMakeupsForStudent(studentId: string, semesterId: string) {
    return Promise.resolve(
      [...this.schedules.values()].filter(
        (row) =>
          row.kind === 'MAKEUP' &&
          row.status === 'SCHEDULED' &&
          row.semesterId === semesterId &&
          (this.participants.get(row.id) ?? []).some(
            (participant) => participant.studentId === studentId,
          ),
      ),
    )
  }

  updateWindow(id: string, fields: ScheduleWindowFields) {
    const row = this.schedules.get(id)
    if (row?.status !== 'SCHEDULED') return Promise.resolve(null)
    const updated = { ...row, ...fields, updatedAt: new Date() }
    this.schedules.set(id, updated)
    return Promise.resolve(updated)
  }

  cancel(id: string) {
    const row = this.schedules.get(id)
    if (row?.status !== 'SCHEDULED') return Promise.resolve(false)
    this.schedules.set(id, { ...row, status: 'CANCELLED' })
    return Promise.resolve(true)
  }

  rotateToken(id: string) {
    const row = this.schedules.get(id)
    if (row?.status !== 'SCHEDULED') return Promise.resolve(null)
    const updated = { ...row, tokenRotation: row.tokenRotation + 1 }
    this.schedules.set(id, updated)
    return Promise.resolve(updated)
  }
}
