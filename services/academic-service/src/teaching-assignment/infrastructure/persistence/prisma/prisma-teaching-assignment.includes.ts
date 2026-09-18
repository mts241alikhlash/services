import { Prisma } from '@prisma/client'

export const TEACHING_ASSIGNMENT_WITH_DETAILS_INCLUDE = {
  subject: true,
  classroom: true,
  semester: { include: { academicYear: true, type: true } },
  schedules: {
    where: { deletedAt: null },
    include: { timeSlot: { include: { type: true } } },
  },
} satisfies Prisma.TeachingAssignmentInclude

export type TeachingAssignmentRow = Prisma.TeachingAssignmentGetPayload<{
  include: typeof TEACHING_ASSIGNMENT_WITH_DETAILS_INCLUDE
}>
