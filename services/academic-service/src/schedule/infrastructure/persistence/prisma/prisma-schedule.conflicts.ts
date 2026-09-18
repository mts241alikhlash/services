import { Day, Schedule } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import {
  SCHEDULE_WITH_DETAILS_INCLUDE,
  ScheduleRow,
} from './prisma-schedule.includes.js'

const notExcluded = (excludeId?: string) =>
  excludeId ? { NOT: { id: excludeId } } : {}

export async function findAssignmentConflict(
  prisma: PrismaService,
  teachingAssignmentId: string,
  timeSlotId: string,
  day: Day,
  excludeId?: string,
): Promise<ScheduleRow | null> {
  return prisma.schedule.findFirst({
    where: {
      teachingAssignmentId,
      day,
      timeSlotId,
      deletedAt: null,
      ...notExcluded(excludeId),
    },
    include: SCHEDULE_WITH_DETAILS_INCLUDE,
  })
}

export async function findEmployeeConflict(
  prisma: PrismaService,
  employeeId: string,
  semesterId: string,
  timeSlotId: string,
  day: Day,
  excludeId?: string,
): Promise<ScheduleRow | null> {
  return prisma.schedule.findFirst({
    where: {
      day,
      timeSlotId,
      deletedAt: null,
      teachingAssignment: { employeeId, semesterId, deletedAt: null },
      ...notExcluded(excludeId),
    },
    include: SCHEDULE_WITH_DETAILS_INCLUDE,
  })
}

export async function findClassroomConflict(
  prisma: PrismaService,
  classroomId: string,
  semesterId: string,
  timeSlotId: string,
  day: Day,
  excludeId?: string,
): Promise<ScheduleRow | null> {
  return prisma.schedule.findFirst({
    where: {
      day,
      timeSlotId,
      deletedAt: null,
      teachingAssignment: { classroomId, semesterId, deletedAt: null },
      ...notExcluded(excludeId),
    },
    include: SCHEDULE_WITH_DETAILS_INCLUDE,
  })
}

export async function findDuplicateRow(
  prisma: PrismaService,
  teachingAssignmentId: string,
  day: Day,
  timeSlotId: string,
  excludeId?: string,
): Promise<Schedule | null> {
  return prisma.schedule.findFirst({
    where: {
      teachingAssignmentId,
      day,
      timeSlotId,
      deletedAt: null,
      ...notExcluded(excludeId),
    },
  })
}

export async function findSoftDeletedRow(
  prisma: PrismaService,
  teachingAssignmentId: string,
  day: Day,
  timeSlotId: string,
): Promise<Schedule | null> {
  return prisma.schedule.findFirst({
    where: {
      teachingAssignmentId,
      day,
      timeSlotId,
      deletedAt: { not: null },
    },
  })
}
