import { Day, Prisma } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { ScheduleQueryInput } from '../../../domain/repositories/schedule.repository.js'
import {
  SCHEDULE_WITH_DETAILS_INCLUDE,
  ScheduleRow,
} from './prisma-schedule.includes.js'
import { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'

export const LIVE_ACADEMIC_YEAR = {
  classroom: { academicYear: { deletedAt: null } },
}

const BY_TIME = [
  { day: 'asc' as const },
  { timeSlot: { order: 'asc' as const } },
]

export async function findSchedulePage(
  prisma: PrismaService,
  query: ScheduleQueryInput,
): Promise<PaginatedResult<ScheduleRow>> {
  const {
    page = 1,
    limit = 10,
    teachingAssignmentId,
    day,
    timeSlotId,
    employeeId,
  } = query

  const where: Prisma.ScheduleWhereInput = {
    deletedAt: null,
    teachingAssignment: LIVE_ACADEMIC_YEAR,
    ...(teachingAssignmentId ? { teachingAssignmentId } : {}),
    ...(day ? { day } : {}),
    ...(timeSlotId ? { timeSlotId } : {}),
    ...(employeeId ? { AND: [{ teachingAssignment: { employeeId } }] } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      include: SCHEDULE_WITH_DETAILS_INCLUDE,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: BY_TIME,
    }),
    prisma.schedule.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function findScheduleById(
  prisma: PrismaService,
  id: string,
): Promise<ScheduleRow | null> {
  return prisma.schedule.findFirst({
    where: { id, deletedAt: null, teachingAssignment: LIVE_ACADEMIC_YEAR },
    include: SCHEDULE_WITH_DETAILS_INCLUDE,
  })
}

export async function findScheduleByClassroom(
  prisma: PrismaService,
  classroomId: string,
): Promise<ScheduleRow[]> {
  return prisma.schedule.findMany({
    where: {
      deletedAt: null,
      teachingAssignment: {
        classroomId,
        deletedAt: null,
        ...LIVE_ACADEMIC_YEAR,
      },
    },
    include: SCHEDULE_WITH_DETAILS_INCLUDE,
    orderBy: BY_TIME,
  })
}

export async function softDeleteClassroomDay(
  prisma: PrismaService,
  classroomId: string,
  day: Day,
): Promise<Prisma.BatchPayload> {
  return prisma.schedule.updateMany({
    where: {
      deletedAt: null,
      day,
      teachingAssignment: {
        classroomId,
        deletedAt: null,
        ...LIVE_ACADEMIC_YEAR,
      },
    },
    data: { deletedAt: new Date() },
  })
}
