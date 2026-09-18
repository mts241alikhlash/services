import { Prisma } from '@prisma/client'
import type {
  StudentQueryInput,
  ExportStudentQueryInput,
} from '../../../domain/repositories/student.repository.js'

export function buildStudentListWhere(
  query: StudentQueryInput,
): Prisma.StudentWhereInput {
  const { semesterId, classroomId, status } = query

  return {
    deletedAt: null,
    ...(status && { status }),
    ...(semesterId && {
      enrollments: {
        some: {
          semesterId,
          deletedAt: null,
          ...(classroomId && { classroomId }),
        },
      },
    }),
    ...(!semesterId &&
      classroomId && {
        enrollments: { some: { classroomId, deletedAt: null } },
      }),
  }
}

export function buildStudentExportWhere(
  filters: ExportStudentQueryInput,
): Prisma.StudentWhereInput {
  const { classroomId } = filters

  return {
    deletedAt: null,
    ...(classroomId && {
      enrollments: { some: { classroomId, deletedAt: null } },
    }),
  }
}
