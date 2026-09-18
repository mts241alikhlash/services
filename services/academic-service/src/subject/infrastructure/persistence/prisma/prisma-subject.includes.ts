import { Prisma } from '@prisma/client'

const TEACHING_ASSIGNMENT_SELECT = {
  id: true,
  employeeId: true,
  classroom: { select: { id: true, name: true } },
} satisfies Prisma.TeachingAssignmentSelect

const SUBJECT_INCLUDE_SHAPE = {
  _count: { select: { teachingAssignments: true } },
  teachingAssignments: { select: TEACHING_ASSIGNMENT_SELECT },
} satisfies Prisma.SubjectInclude

export type SubjectRow = Prisma.SubjectGetPayload<{
  include: typeof SUBJECT_INCLUDE_SHAPE
}>

export function buildSubjectInclude(activeSemesterId: string | null) {
  const assignmentWhere: Prisma.TeachingAssignmentWhereInput = {
    deletedAt: null,
    semesterId: activeSemesterId ? { equals: activeSemesterId } : { in: [] },
  }

  return {
    _count: { select: { teachingAssignments: { where: assignmentWhere } } },
    teachingAssignments: {
      where: assignmentWhere,
      select: TEACHING_ASSIGNMENT_SELECT,
      orderBy: { classroom: { name: 'asc' } },
    },
  } satisfies Prisma.SubjectInclude
}
