import type { Prisma } from '../../../../generated/prisma/client.js'
import type { ExamSchedule } from '../../../domain/entities/exam-schedule.entity.js'

export const SCHEDULE_INCLUDE = {
  package: { select: { title: true } },
} satisfies Prisma.ExamScheduleInclude

type Row = Prisma.ExamScheduleGetPayload<{ include: typeof SCHEDULE_INCLUDE }>

export function toSchedule(row: Row): ExamSchedule {
  return {
    id: row.id,
    packageId: row.packageId,
    packageTitle: row.package.title,
    classroomId: row.classroomId,
    semesterId: row.semesterId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    durationMinutes: row.durationMinutes,
    tokenRotation: row.tokenRotation,
    status: row.status,
    createdById: row.createdById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
