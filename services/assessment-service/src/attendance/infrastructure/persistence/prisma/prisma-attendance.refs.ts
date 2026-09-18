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
    const enrolment = enrollmentById.get(row.enrollmentId)
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
      enrollment: enrolment
        ? {
            id: enrolment.id,
            studentId: enrolment.studentId,
            classroomId: enrolment.classroomId,
            semesterId: enrolment.semesterId,
            student: {
              id: enrolment.studentId,
              userId: enrolment.studentUserId ?? '',
              user: enrolment.studentUserId
                ? {
                    id: enrolment.studentUserId,
                    identifier: enrolment.studentNis ?? '',
                    isActive: true,
                    profile: { name: enrolment.studentName ?? '' },
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
