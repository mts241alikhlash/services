import {
  IAcademicLookupPort,
  TeachingAssignmentDetail,
} from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { AttendanceWithDetails } from '../../../domain/entities/attendance.entity.js'
import { AttendanceRow } from './prisma-attendance.includes.js'

export async function decorateAttendance(
  rows: AttendanceRow[],
  enrollmentLookup: IEnrollmentLookupPort,
  academicLookup: IAcademicLookupPort,
): Promise<AttendanceWithDetails[]> {
  if (rows.length === 0) return []

  const scheduleIds = [
    ...new Set(
      rows
        .map((row) => row.scheduleId)
        .filter((id): id is string => id !== null),
    ),
  ]

  const [enrollments, schedules] = await Promise.all([
    enrollmentLookup.listByIds([
      ...new Set(rows.map((row) => row.enrollmentId)),
    ]),
    academicLookup.listSchedules(scheduleIds),
  ])

  const assignments = await academicLookup.listTeachingAssignments([
    ...new Set(schedules.map((schedule) => schedule.teachingAssignmentId)),
  ])

  const enrollmentById = new Map(enrollments.map((row) => [row.id, row]))
  const scheduleById = new Map(schedules.map((row) => [row.id, row]))
  const assignmentById = new Map(assignments.map((row) => [row.id, row]))

  return rows.map((row) => {
    const enrollment = enrollmentById.get(row.enrollmentId)
    const schedule = row.scheduleId ? scheduleById.get(row.scheduleId) : null

    return {
      ...row,
      schedule: schedule
        ? {
            id: schedule.id,
            teachingAssignmentId: schedule.teachingAssignmentId,
            timeSlotId: schedule.timeSlotId,
            teachingAssignment: toAssignment(
              assignmentById.get(schedule.teachingAssignmentId),
            ),
          }
        : null,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            studentId: enrollment.studentId,
            classroomId: enrollment.classroomId,
            semesterId: enrollment.semesterId,
            student: {
              id: enrollment.studentId,
              userId: enrollment.studentUserId ?? '',
              user: enrollment.studentUserId
                ? {
                    id: enrollment.studentUserId,
                    identifier: enrollment.studentNis ?? '',
                    isActive: true,
                    profile: { name: enrollment.studentName ?? '' },
                  }
                : undefined,
            },
          }
        : undefined,
    }
  })
}

function toAssignment(assignment: TeachingAssignmentDetail | undefined) {
  if (!assignment) return undefined
  return {
    id: assignment.id,
    subject: {
      id: assignment.subjectId,
      code: assignment.subjectCode,
      name: assignment.subjectName,
    },
    classroom: {
      id: assignment.classroomId,
      code: assignment.classroomCode,
      name: assignment.classroomName,
    },
  }
}
