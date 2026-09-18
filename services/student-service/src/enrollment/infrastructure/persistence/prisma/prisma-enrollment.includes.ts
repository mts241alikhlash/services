import { Prisma } from '@prisma/client'

export const ENROLLMENT_WITH_DETAILS_INCLUDE = {
  student: true,
} satisfies Prisma.StudentEnrollmentInclude

export type EnrollmentRow = Prisma.StudentEnrollmentGetPayload<{
  include: typeof ENROLLMENT_WITH_DETAILS_INCLUDE
}>
