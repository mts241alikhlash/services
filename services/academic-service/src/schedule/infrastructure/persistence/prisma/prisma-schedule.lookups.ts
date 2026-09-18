import { PrismaService } from '../../../../core/database/prisma.service.js'
import type { TeachingAssignmentIdRef } from '../../../domain/repositories/schedule.repository.js'

const ASSIGNMENT_REF_SELECT = {
  id: true,
  employeeId: true,
  classroomId: true,
  semesterId: true,
} as const

export async function findTeachingAssignmentId(
  prisma: PrismaService,
  id: string,
): Promise<TeachingAssignmentIdRef | null> {
  return prisma.teachingAssignment.findFirst({
    where: {
      id,
      classroom: { academicYear: { deletedAt: null } },
      deletedAt: null,
    },
    select: ASSIGNMENT_REF_SELECT,
  })
}

export async function findValidClassroomId(
  prisma: PrismaService,
  id: string,
): Promise<{ id: string } | null> {
  return prisma.classroom.findFirst({
    where: { id, academicYear: { deletedAt: null }, deletedAt: null },
    select: { id: true },
  })
}

export async function findActiveSemesterId(
  prisma: PrismaService,
): Promise<{ id: string } | null> {
  return prisma.semester.findFirst({
    where: {
      isActive: true,
      deletedAt: null,
      academicYear: { deletedAt: null },
    },
    select: { id: true },
  })
}

export async function findTeachingAssignmentIdBySubject(
  prisma: PrismaService,
  classroomId: string,
  subjectId: string,
  semesterId: string,
): Promise<TeachingAssignmentIdRef | null> {
  return prisma.teachingAssignment.findFirst({
    where: { classroomId, subjectId, semesterId, deletedAt: null },
    select: ASSIGNMENT_REF_SELECT,
  })
}

export async function findAnyEmployeeIdBySubject(
  prisma: PrismaService,
  subjectId: string,
): Promise<string | null> {
  const res = await prisma.teachingAssignment.findFirst({
    where: { subjectId, deletedAt: null },
    select: { employeeId: true },
  })
  return res?.employeeId ?? null
}

export async function createTeachingAssignmentRow(
  prisma: PrismaService,
  data: {
    classroomId: string
    subjectId: string
    employeeId: string
    semesterId: string
  },
): Promise<TeachingAssignmentIdRef> {
  return prisma.teachingAssignment.create({
    data,
    select: ASSIGNMENT_REF_SELECT,
  })
}
