import { Prisma } from '@prisma/client'

export const STUDENT_INCLUDE = {
  enrollments: {
    where: { deletedAt: null },
    orderBy: { enrolledAt: 'desc' as const },
  },
} satisfies Prisma.StudentInclude

export const STUDENT_LIST_INCLUDE = STUDENT_INCLUDE
export const STUDENT_DETAIL_INCLUDE = STUDENT_INCLUDE
export const STUDENT_EXPORT_INCLUDE = STUDENT_INCLUDE

export type StudentRow = Prisma.StudentGetPayload<{
  include: typeof STUDENT_INCLUDE
}>
