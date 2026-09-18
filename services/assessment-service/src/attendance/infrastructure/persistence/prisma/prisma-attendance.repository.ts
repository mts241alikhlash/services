import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { AttendanceEntity } from '../../../domain/entities/attendance.entity.js'
import { AttendanceWithDetails } from '../../../domain/entities/attendance.entity.js'
import {
  AttendanceQueryInput,
  AttendanceRecapQueryInput,
  AttendanceStatusCounts,
  AttendanceTrendQueryInput,
  BulkAttendanceRecord,
  CreateAttendanceRepositoryInput,
  IAttendanceRepository,
  RestoreAttendanceRepositoryInput,
  UpdateAttendanceRepositoryInput,
} from '../../../domain/repositories/attendance.repository.js'
import { AttendanceRow } from './prisma-attendance.includes.js'
import { buildAttendanceListWhere } from './prisma-attendance.where.js'
import { decorateAttendance } from './prisma-attendance.refs.js'
import {
  buildAttendanceMonthlyTrend,
  buildAttendanceRecap,
  buildAttendanceStatusCounts,
} from './prisma-attendance.reports.js'

@Injectable()
export class PrismaAttendanceRepository extends IAttendanceRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly academicLookup: IAcademicLookupPort,
    private readonly enrollmentLookup: IEnrollmentLookupPort,
  ) {
    super()
  }

  private async decorate(
    rows: AttendanceRow[],
  ): Promise<AttendanceWithDetails[]> {
    return decorateAttendance(rows, this.enrollmentLookup, this.academicLookup)
  }

  async findAttendance(
    teachingAssignmentId: string,
    studentEnrollmentId: string,
    date: Date,
    excludeId?: string,
  ): Promise<AttendanceEntity | null> {
    return this.prisma.attendance.findFirst({
      where: {
        enrollmentId: studentEnrollmentId,
        date,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async findAll(query: AttendanceQueryInput) {
    const { page = 1, limit = 10, semesterId, classroomId, studentId } = query

    const scopesEnrolment = Boolean(classroomId ?? studentId ?? semesterId)
    const scopedEnrollmentIds =
      scopesEnrolment && !query.enrollmentId
        ? (
            await this.enrollmentLookup.search({
              classroomId,
              studentId,
              semesterId: semesterId ?? undefined,
            })
          ).map((enrolment) => enrolment.id)
        : null

    const where = buildAttendanceListWhere(query, scopedEnrollmentIds, null)

    const [rows, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ])
    return { data: await this.decorate(rows), total, page, limit }
  }

  async findById(id: string) {
    const row = await this.prisma.attendance.findFirst({
      where: { id, deletedAt: null },
    })
    if (!row) return null
    const [withRefs] = await this.decorate([row])
    return withRefs
  }

  async findDuplicate(
    enrollmentId: string,
    date: Date,
    scheduleId?: string,
    excludeId?: string,
  ) {
    return this.prisma.attendance.findFirst({
      where: {
        enrollmentId,
        date,
        scheduleId: scheduleId ?? null,
        deletedAt: null,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    })
  }

  async create(data: CreateAttendanceRepositoryInput) {
    return this.prisma.attendance.create({
      data: {
        enrollmentId: data.enrollmentId,
        date: data.date,
        status: data.status,
        scheduleId: data.scheduleId,
        note: data.note,
      },
    })
  }

  async update(id: string, data: UpdateAttendanceRepositoryInput) {
    return this.prisma.attendance.update({ where: { id }, data })
  }

  async findSoftDeleted(enrollmentId: string, date: Date, scheduleId?: string) {
    return this.prisma.attendance.findFirst({
      where: {
        enrollmentId,
        date,
        scheduleId: scheduleId ?? null,
        deletedAt: { not: null },
      },
    })
  }

  async restore(id: string, data: RestoreAttendanceRepositoryInput) {
    return this.prisma.attendance.update({
      where: { id },
      data: { status: data.status, note: data.note, deletedAt: null },
    })
  }

  async softDelete(id: string) {
    return this.prisma.attendance.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async bulkUpsert(
    date: Date,
    records: BulkAttendanceRecord[],
    scheduleId?: string,
  ) {
    const results = await this.prisma.$transaction(async (tx) => {
      const ops = records.map(async (record) => {
        if (scheduleId) {
          return tx.attendance.upsert({
            where: {
              enrollmentId_date_scheduleId: {
                enrollmentId: record.enrollmentId,
                date,
                scheduleId,
              },
            },
            update: {
              status: record.status,
              note: record.note,
              deletedAt: null,
            },
            create: {
              enrollmentId: record.enrollmentId,
              date,
              status: record.status,
              scheduleId,
              note: record.note,
            },
          })
        }

        const existing = await tx.attendance.findFirst({
          where: {
            enrollmentId: record.enrollmentId,
            date,
            scheduleId: null,
            deletedAt: null,
          },
        })

        if (existing) {
          return tx.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              note: record.note,
              deletedAt: null,
            },
          })
        }

        return tx.attendance.create({
          data: {
            enrollmentId: record.enrollmentId,
            date,
            status: record.status,
            note: record.note,
          },
        })
      })

      return Promise.all(ops)
    })
    return { saved: results.length }
  }

  async getRecap(query: AttendanceRecapQueryInput) {
    return buildAttendanceRecap(this.prisma, this.enrollmentLookup, query)
  }

  async getStatusCounts(enrollmentId: string): Promise<AttendanceStatusCounts> {
    return buildAttendanceStatusCounts(this.prisma, enrollmentId)
  }

  async getMonthlyTrend(query: AttendanceTrendQueryInput) {
    return buildAttendanceMonthlyTrend(
      this.prisma,
      this.enrollmentLookup,
      query,
    )
  }

  async remove(id: string) {
    return this.softDelete(id)
  }
}
