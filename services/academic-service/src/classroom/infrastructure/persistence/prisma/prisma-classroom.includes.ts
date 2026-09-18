import { Prisma } from '@prisma/client'

export const CLASSROOM_WITH_DETAILS_INCLUDE = {
  grade: true,
  academicYear: true,
  classroomSupervisors: {
    where: { deletedAt: null },
    take: 1,
  },
} satisfies Prisma.ClassroomInclude

export function classroomWithDetailsInclude(
  semesterId: string | null | undefined,
) {
  return {
    ...CLASSROOM_WITH_DETAILS_INCLUDE,
    classroomSupervisors: {
      ...CLASSROOM_WITH_DETAILS_INCLUDE.classroomSupervisors,
      where: {
        deletedAt: null,
        ...(semesterId ? { semesterId } : {}),
      },
    },
  } satisfies Prisma.ClassroomInclude
}

export type ClassroomWithDetails = Prisma.ClassroomGetPayload<{
  include: typeof CLASSROOM_WITH_DETAILS_INCLUDE
}>

export const SUPERVISOR_WITH_DETAILS_INCLUDE = {
  classroom: true,
  semester: { include: { academicYear: true } },
} satisfies Prisma.ClassroomSupervisorInclude

export const CLASSROOM_SUPERVISOR_WITH_DETAILS_INCLUDE =
  SUPERVISOR_WITH_DETAILS_INCLUDE

export type SupervisorWithDetails = Prisma.ClassroomSupervisorGetPayload<{
  include: typeof SUPERVISOR_WITH_DETAILS_INCLUDE
}>

export type SupervisorRow = SupervisorWithDetails

export const STRUCTURE_WITH_DETAILS_INCLUDE = {
  classroom: true,
  semester: { include: { academicYear: true } },
} satisfies Prisma.ClassroomStructureInclude

export const CLASSROOM_STRUCTURE_WITH_DETAILS_INCLUDE =
  STRUCTURE_WITH_DETAILS_INCLUDE

export type StructureWithDetails = Prisma.ClassroomStructureGetPayload<{
  include: typeof STRUCTURE_WITH_DETAILS_INCLUDE
}>

export type StructureRow = StructureWithDetails
