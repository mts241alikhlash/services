import { randomUUID } from 'node:crypto'
import type { FakeExamPackageRepository } from '../../exam-package/application/exam-package.repository.fake.js'
import type { ExamSchedule } from '../domain/entities/exam-schedule.entity.js'
import {
  IExamScheduleRepository,
  type ExamScheduleListQuery,
  type NewExamSchedule,
  type ScheduleWindowFields,
} from '../domain/repositories/exam-schedule.repository.js'

export class FakeExamScheduleRepository extends IExamScheduleRepository {
  readonly schedules = new Map<string, ExamSchedule>()

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

  findForClassroom(classroomId: string, semesterId: string) {
    return Promise.resolve(
      [...this.schedules.values()].filter(
        (row) =>
          row.classroomId === classroomId &&
          row.semesterId === semesterId &&
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
      classroomId: input.classroomId,
      semesterId: input.semesterId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      durationMinutes: input.durationMinutes,
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
