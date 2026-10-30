import { ConflictException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { Prisma } from '../../../../generated/prisma/client.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ExamSchedule } from '../../../domain/entities/exam-schedule.entity.js'
import type {
  NewParticipant,
  ScheduleParticipant,
} from '../../../domain/entities/schedule-participant.entity.js'
import {
  IExamScheduleRepository,
  type ExamScheduleGradingQuery,
  type ExamScheduleListQuery,
  type NewExamSchedule,
  type NewMakeupSchedule,
  type ScheduleWindowFields,
} from '../../../domain/repositories/exam-schedule.repository.js'
import {
  SCHEDULE_INCLUDE,
  toParticipant,
  toSchedule,
} from './prisma-exam-schedule.mapper.js'

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

  async findForGrading(
    query: ExamScheduleGradingQuery,
  ): Promise<PaginatedResult<ExamSchedule>> {
    if (query.pairs !== null && query.pairs.length === 0) {
      return { data: [], total: 0, page: query.page, limit: query.limit }
    }
    const where: Prisma.ExamScheduleWhereInput = {
      semesterId: query.semesterId,
      AND: [
        {
          OR: [
            { sessions: { some: {} } },
            { kind: 'MAKEUP' },
            { endsAt: { lte: query.now } },
          ],
        },
        ...(query.pairs === null
          ? []
          : [
              {
                OR: query.pairs.map((pair) => ({
                  classroomId: pair.classroomId,
                  package: { subjectId: pair.subjectId },
                })),
              },
            ]),
      ],
    }
    const [rows, total] = await Promise.all([
      this.prisma.examSchedule.findMany({
        where,
        include: SCHEDULE_INCLUDE,
        orderBy: [{ startsAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.examSchedule.count({ where }),
    ])
    return {
      data: rows.map(toSchedule),
      total,
      page: query.page,
      limit: query.limit,
    }
  }

  async findForClassroom(
    classroomId: string,
    semesterId: string,
  ): Promise<ExamSchedule[]> {
    const rows = await this.prisma.examSchedule.findMany({
      where: { classroomId, semesterId, status: 'SCHEDULED', kind: 'REGULAR' },
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
        where: { id: input.packageId, status: 'APPROVED', deletedAt: null },
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

  async createMakeup(input: NewMakeupSchedule): Promise<ExamSchedule | null> {
    const { participants, ...fields } = input
    return this.prisma.$transaction(async (tx) => {
      await tx.examPackage.updateMany({
        where: { id: input.packageId, status: 'APPROVED', deletedAt: null },
        data: { status: 'LOCKED', lockedAt: new Date() },
      })
      const locked = await tx.examPackage.findFirst({
        where: {
          id: input.packageId,
          status: 'LOCKED',
          deletedAt: null,
        },
        select: { id: true },
      })
      if (locked === null) return null
      await this.assertNotOnLiveMakeup(
        tx,
        input.makeupOfId,
        participants.map((participant) => participant.studentId),
      )
      const row = await tx.examSchedule.create({
        data: {
          ...fields,
          kind: 'MAKEUP',
          participants: {
            create: participants.map((participant) => ({
              ...participant,
              addedById: input.createdById,
            })),
          },
        },
        include: SCHEDULE_INCLUDE,
      })
      return toSchedule(row)
    })
  }

  async listParticipants(scheduleId: string): Promise<ScheduleParticipant[]> {
    const rows = await this.prisma.examScheduleParticipant.findMany({
      where: { scheduleId },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toParticipant)
  }

  async addParticipants(
    scheduleId: string,
    rows: NewParticipant[],
    addedById: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const makeup = await tx.examSchedule.findUnique({
        where: { id: scheduleId },
        select: { makeupOfId: true },
      })
      if (makeup?.makeupOfId) {
        await this.assertNotOnLiveMakeup(
          tx,
          makeup.makeupOfId,
          rows.map((row) => row.studentId),
        )
      }
      await tx.examScheduleParticipant.createMany({
        data: rows.map((row) => ({ ...row, scheduleId, addedById })),
      })
    })
  }

  private async assertNotOnLiveMakeup(
    tx: Prisma.TransactionClient,
    originalId: string,
    studentIds: string[],
  ): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${originalId}))`
    const clash = await tx.examScheduleParticipant.findFirst({
      where: {
        studentId: { in: studentIds },
        schedule: {
          makeupOfId: originalId,
          status: 'SCHEDULED',
          endsAt: { gt: new Date() },
        },
      },
      select: { id: true },
    })
    if (clash !== null) {
      throw new ConflictException('Siswa sudah terdaftar di susulan lain')
    }
  }

  async removeParticipant(
    scheduleId: string,
    studentId: string,
  ): Promise<boolean> {
    const result = await this.prisma.examScheduleParticipant.deleteMany({
      where: {
        scheduleId,
        studentId,
        schedule: { sessions: { none: { studentId } } },
      },
    })
    return result.count > 0
  }

  async findParticipation(
    scheduleId: string,
    studentId: string,
  ): Promise<ScheduleParticipant | null> {
    const row = await this.prisma.examScheduleParticipant.findUnique({
      where: { scheduleId_studentId: { scheduleId, studentId } },
    })
    return row ? toParticipant(row) : null
  }

  async findMakeupsOf(originalId: string): Promise<ExamSchedule[]> {
    const rows = await this.prisma.examSchedule.findMany({
      where: { kind: 'MAKEUP', makeupOfId: originalId },
      include: SCHEDULE_INCLUDE,
      orderBy: { startsAt: 'asc' },
    })
    return rows.map(toSchedule)
  }

  async findMakeupsForStudent(
    studentId: string,
    semesterId: string,
  ): Promise<ExamSchedule[]> {
    const rows = await this.prisma.examSchedule.findMany({
      where: {
        kind: 'MAKEUP',
        status: 'SCHEDULED',
        semesterId,
        participants: { some: { studentId } },
      },
      include: SCHEDULE_INCLUDE,
      orderBy: { startsAt: 'asc' },
    })
    return rows.map(toSchedule)
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
            type: fields.type,
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
