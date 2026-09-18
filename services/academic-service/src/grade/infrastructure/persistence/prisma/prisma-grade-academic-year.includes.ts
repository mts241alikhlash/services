import { Prisma } from '@prisma/client'

export const GRADE_ACADEMIC_YEAR_INCLUDE = {
  grade: {
    select: { id: true, level: true, name: true, deletedAt: true },
  },
  academicYear: {
    select: { id: true, name: true, isActive: true, deletedAt: true },
  },
  curricula: {
    select: { id: true, name: true, deletedAt: true },
  },
} satisfies Prisma.GradeAcademicYearInclude

export const GRADE_AY_WITH_DETAILS_INCLUDE = GRADE_ACADEMIC_YEAR_INCLUDE

export type GradeAcademicYearWithDetails = Prisma.GradeAcademicYearGetPayload<{
  include: typeof GRADE_ACADEMIC_YEAR_INCLUDE
}>
