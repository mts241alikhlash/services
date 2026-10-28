import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { Prisma } from '../../../../generated/prisma/client.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ExamSchedule } from '../../../domain/entities/exam-schedule.entity.js'
import {
  IExamScheduleRepository,
  type ExamScheduleListQuery,
  type NewExamSchedule,
  type ScheduleWindowFields,
} from '../../../domain/repositories/exam-schedule.repository.js'
import { SCHEDULE_INCLUDE, toSchedule } from './prisma-exam-schedule.mapper.js'

function buildWhere(
  query: ExamScheduleListQuery,
): Prisma.ExamScheduleWhereInput {
  return {
    ...(query.classroomId ? { classroomId: query.classroomId } : {}),
    ...(query.packageId ? { packageId: query.packageId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.from ? { endsAt: { gte: query.from } } : {}),
    ...(query.to ? { startsAt: { lte: query.to } } : {}),
  }
}

@Injectable()
export class PrismaExamScheduleRepository extends IExamScheduleRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findAll(
    query: ExamScheduleListQuery,
  ): Promise<PaginatedResult<ExamSchedule>> {
    const { page, limit } = query
    const where = buildWhere(query)
    const [rows, total] = await Promise.all([
      this.prisma.examSchedule.findMany({
        where,
        include: SCHEDULE_INCLUDE,
        orderBy: [{ startsAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.examSchedule.count({ where }),
    ])
    return { data: rows.map(toSchedule), total, page, limit }
  }

  async findForClassroom(
    classroomId: string,
    semesterId: string,
  ): Promise<ExamSchedule[]> {
    const rows = await this.prisma.examSchedule.findMany({
      where: { classroomId, semesterId, status: 'SCHEDULED' },
      include: SCHEDULE_INCLUDE,
      orderBy: { startsAt: 'asc' },
    })
    return rows.map(toSchedule)
  }

  async findById(id: string): Promise<ExamSchedule | null> {
    const row = await this.prisma.examSchedule.findUnique({
      where: { id },
      include: SCHEDULE_INCLUDE,
    })
    return row ? toSchedule(row) : null
  }

  async createAndLockPackage(
    input: NewExamSchedule,
  ): Promise<ExamSchedule | null> {
    return this.prisma.$transaction(async (tx) => {
      await tx.examPackage.updateMany({
        where: { id: input.packageId, status: 'DRAFT', deletedAt: null },
        data: { status: 'LOCKED', lockedAt: new Date() },
      })
      const locked = await tx.examPackage.findFirst({
        where: { id: input.packageId, status: 'LOCKED', deletedAt: null },
        select: { id: true },
      })
      if (locked === null) return null
      const row = await tx.examSchedule.create({
        data: input,
        include: SCHEDULE_INCLUDE,
      })
      return toSchedule(row)
    })
  }

  async updateWindow(
    id: string,
    fields: ScheduleWindowFields,
  ): Promise<ExamSchedule | null> {
    const result = await this.prisma.examSchedule.updateMany({
      where: {
        id,
        status: 'SCHEDULED',
        OR: [
          { sessions: { none: {} } },
          {
            startsAt: fields.startsAt,
            durationMinutes: fields.durationMinutes,
            endsAt: { lte: fields.endsAt },
          },
        ],
      },
      data: fields,
    })
    return result.count === 0 ? null : this.findById(id)
  }

  async cancel(id: string): Promise<boolean> {
    const result = await this.prisma.examSchedule.updateMany({
      where: { id, status: 'SCHEDULED', sessions: { none: {} } },
      data: { status: 'CANCELLED' },
    })
    return result.count > 0
  }

  async rotateToken(id: string): Promise<ExamSchedule | null> {
    const result = await this.prisma.examSchedule.updateMany({
      where: { id, status: 'SCHEDULED' },
      data: { tokenRotation: { increment: 1 } },
    })
    return result.count === 0 ? null : this.findById(id)
  }
}
