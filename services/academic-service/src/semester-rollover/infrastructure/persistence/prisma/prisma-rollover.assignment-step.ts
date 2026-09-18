import { Prisma } from '@prisma/client'
import {
  RolloverResult,
  RolloverSourceData,
} from '../../../domain/repositories/rollover.repository.js'

export async function copyAssignmentsWithSchedules(
  tx: Prisma.TransactionClient,
  assignments: RolloverSourceData['assignments'],
  classroomIdMap: Map<string, string>,
  targetSemesterId: string,
  result: RolloverResult,
): Promise<void> {
  for (const assignment of assignments) {
    const newClassroomId = classroomIdMap.get(assignment.classroomId)
    if (!newClassroomId) continue

    const existing = await tx.teachingAssignment.findFirst({
      where: {
        employeeId: assignment.employeeId,
        classroomId: newClassroomId,
        subjectId: assignment.subjectId,
        semesterId: targetSemesterId,
        deletedAt: null,
      },
    })

    let newAssignmentId: string
    if (existing) {
      newAssignmentId = existing.id
      result.teachingAssignments.skipped++
    } else {
      const created = await tx.teachingAssignment.create({
        data: {
          employeeId: assignment.employeeId,
          classroomId: newClassroomId,
          subjectId: assignment.subjectId,
          semesterId: targetSemesterId,
        },
      })
      newAssignmentId = created.id
      result.teachingAssignments.created++
    }

    for (const schedule of assignment.schedules) {
      const existingSchedule = await tx.schedule.findFirst({
        where: {
          teachingAssignmentId: newAssignmentId,
          day: schedule.day,
          timeSlotId: schedule.timeSlotId,
          deletedAt: null,
        },
      })

      if (existingSchedule) {
        result.schedules.skipped++
        continue
      }

      await tx.schedule.create({
        data: {
          teachingAssignmentId: newAssignmentId,
          timeSlotId: schedule.timeSlotId,
          day: schedule.day,
          room: schedule.room,
        },
      })
      result.schedules.created++
    }
  }
}
