import { Prisma } from '../../../../generated/prisma/client.js'

export const CALENDAR_WITH_DETAILS_INCLUDE = {
  academicYear: true,
  semester: true,
  type: true,
  classrooms: { include: { classroom: true } },
} satisfies Prisma.AcademicCalendarInclude

export type CalendarWithDetails = Prisma.AcademicCalendarGetPayload<{
  include: typeof CALENDAR_WITH_DETAILS_INCLUDE
}>
