import { EnrollmentStatus, Prisma, StudentEnrollment } from '@prisma/client'
import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { StudentEnrollmentQueryInput } from '../../../domain/repositories/enrollment.repository.js'
import {
  ENROLLMENT_WITH_DETAILS_INCLUDE,
  EnrollmentRow,
} from './prisma-enrollment.includes.js'

const ACTIVE = { status: EnrollmentStatus.ACTIVE, deletedAt: null }

export function buildEnrollmentListWhere(
  query: StudentEnrollmentQueryInput,
  resolvedSemesterId?: string | null,
  academicYearSemesterIds?: string[] | null,
): Prisma.StudentEnrollmentWhereInput {
  const { studentId, classroomId, academicYearId, status } = query

  return {
    deletedAt: null,
    ...(studentId && { studentId }),
    ...(classroomId && { classroomId }),
    ...(status && { status }),
    ...buildTermFilter(
      resolvedSemesterId,
      academicYearId ? (academicYearSemesterIds ?? []) : null,
    ),
  }
}

function buildTermFilter(
  resolvedSemesterId: string | null | undefined,
  academicYearSemesterIds: string[] | null,
): Prisma.StudentEnrollmentWhereInput {
  if (academicYearSemesterIds === null) {
    return resolvedSemesterId ? { semesterId: resolvedSemesterId } : {}
  }
  if (!resolvedSemesterId) {
    return { semesterId: { in: academicYearSemesterIds } }
  }
  return academicYearSemesterIds.includes(resolvedSemesterId)
    ? { semesterId: resolvedSemesterId }
    : { semesterId: { in: [] } }
}

export async function countActiveByClassroomSemester(
  prisma: PrismaService,
  classroomId: string,
  semesterId: string,
): Promise<number> {
  return prisma.studentEnrollment.count({
    where: { classroomId, semesterId, ...ACTIVE },
  })
}

export async function countActiveByClassroomIds(
  prisma: PrismaService,
  classroomIds: string[],
  semesterId: string,
): Promise<{ classroomId: string; count: number }[]> {
  if (classroomIds.length === 0) return []

  const grouped = await prisma.studentEnrollment.groupBy({
    by: ['classroomId'],
    where: { classroomId: { in: classroomIds }, semesterId, ...ACTIVE },
    _count: { _all: true },
  })
  return grouped.map((row) => ({
    classroomId: row.classroomId,
    count: row._count._all,
  }))
}

export async function countBySemesterIds(
  prisma: PrismaService,
  semesterIds: string[],
): Promise<{ semesterId: string; count: number }[]> {
  if (semesterIds.length === 0) return []

  const grouped = await prisma.studentEnrollment.groupBy({
    by: ['semesterId'],
    where: { semesterId: { in: semesterIds }, deletedAt: null },
    _count: { _all: true },
  })
  return grouped.map((row) => ({
    semesterId: row.semesterId,
    count: row._count._all,
  }))
}

export async function countActiveByIds(
  prisma: PrismaService,
  ids: string[],
): Promise<number> {
  return prisma.studentEnrollment.count({
    where: { id: { in: ids }, ...ACTIVE },
  })
}

export async function findManyActiveByIds(
  prisma: PrismaService,
  ids: string[],
): Promise<EnrollmentRow[]> {
  return prisma.studentEnrollment.findMany({
    where: { id: { in: ids }, ...ACTIVE },
    include: ENROLLMENT_WITH_DETAILS_INCLUDE,
  })
}

export async function findActiveEnrollment(
  prisma: PrismaService,
  studentId: string,
  semesterId?: string,
  excludeId?: string,
): Promise<EnrollmentRow | null> {
  return prisma.studentEnrollment.findFirst({
    where: {
      studentId,
      ...(semesterId && { semesterId }),
      ...ACTIVE,
      ...(excludeId && { NOT: { id: excludeId } }),
    },
    include: ENROLLMENT_WITH_DETAILS_INCLUDE,
  })
}

export async function findDuplicateEnrollment(
  prisma: PrismaService,
  studentId: string,
  semesterId?: string,
  excludeId?: string,
): Promise<StudentEnrollment | null> {
  return prisma.studentEnrollment.findFirst({
    where: {
      studentId,
      ...(semesterId && { semesterId }),
      deletedAt: null,
      ...(excludeId && { NOT: { id: excludeId } }),
    },
  })
}

export async function findSoftDeletedEnrollment(
  prisma: PrismaService,
  studentId: string,
  semesterId: string,
): Promise<StudentEnrollment | null> {
  return prisma.studentEnrollment.findFirst({
    where: { studentId, semesterId, deletedAt: { not: null } },
  })
}
