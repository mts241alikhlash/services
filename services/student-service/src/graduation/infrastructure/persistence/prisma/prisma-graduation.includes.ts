import { Prisma } from '@prisma/client'

export const GRADUATION_WITH_DETAILS_INCLUDE = {
  student: true,
} satisfies Prisma.StudentGraduationInclude

export type GraduationRow = Prisma.StudentGraduationGetPayload<{
  include: typeof GRADUATION_WITH_DETAILS_INCLUDE
}>
