import { Prisma } from '@prisma/client'

export const SEMESTER_WITH_DETAILS_INCLUDE = {
  academicYear: { select: { id: true, name: true } },
  type: { select: { id: true, name: true, sequence: true } },
} satisfies Prisma.SemesterInclude
