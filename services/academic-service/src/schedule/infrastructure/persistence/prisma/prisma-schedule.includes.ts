import { Prisma } from '@prisma/client'

export const SCHEDULE_WITH_DETAILS_INCLUDE = {
  timeSlot: { include: { type: true } },
  teachingAssignment: {
    include: {
      subject: true,
      classroom: true,
    },
  },
} satisfies Prisma.ScheduleInclude

export type ScheduleRow = Prisma.ScheduleGetPayload<{
  include: typeof SCHEDULE_WITH_DETAILS_INCLUDE
}>
