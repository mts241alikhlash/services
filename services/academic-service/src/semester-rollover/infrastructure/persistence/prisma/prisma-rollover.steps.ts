import { Prisma } from '@prisma/client'
import {
  RolloverResult,
  RolloverSourceData,
} from '../../../domain/repositories/rollover.repository.js'

export function emptyRolloverResult(): RolloverResult {
  return {
    classrooms: { created: 0, skipped: 0 },
    enrollments: { created: 0, skipped: 0 },
    supervisors: { created: 0, skipped: 0 },
    teachingAssignments: { created: 0, skipped: 0 },
    schedules: { created: 0, skipped: 0 },
  }
}

export async function copyClassrooms(
  tx: Prisma.TransactionClient,
  classrooms: RolloverSourceData['classrooms'],
  targetAcademicYearId: string,
  result: RolloverResult,
): Promise<Map<string, string>> {
  const classroomIdMap = new Map<string, string>()

  for (const classroom of classrooms) {
    const existing = await tx.classroom.findFirst({
      where: {
        academicYearId: targetAcademicYearId,
        gradeId: classroom.gradeId,
        code: classroom.code,
        deletedAt: null,
      },
    })

    if (existing) {
      classroomIdMap.set(classroom.id, existing.id)
      result.classrooms.skipped++
      continue
    }

    const created = await tx.classroom.create({
      data: {
        academicYearId: targetAcademicYearId,
        gradeId: classroom.gradeId,
        code: classroom.code,
        name: classroom.name,
        capacity: classroom.capacity,
        isActive: classroom.isActive,
      },
    })
    classroomIdMap.set(classroom.id, created.id)
    result.classrooms.created++
  }

  return classroomIdMap
}

export async function copySupervisors(
  tx: Prisma.TransactionClient,
  supervisors: RolloverSourceData['supervisors'],
  classroomIdMap: Map<string, string>,
  targetSemesterId: string,
  result: RolloverResult,
): Promise<void> {
  for (const supervisor of supervisors) {
    const newClassroomId = classroomIdMap.get(supervisor.classroomId)
    if (!newClassroomId) continue

    const existing = await tx.classroomSupervisor.findFirst({
      where: {
        classroomId: newClassroomId,
        semesterId: targetSemesterId,
        deletedAt: null,
      },
    })

    if (existing) {
      result.supervisors.skipped++
      continue
    }

    await tx.classroomSupervisor.create({
      data: {
        classroomId: newClassroomId,
        employeeId: supervisor.employeeId,
        semesterId: targetSemesterId,
      },
    })
    result.supervisors.created++
  }
}
