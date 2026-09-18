import { Prisma } from '@prisma/client'
import { AttendanceQueryInput } from '../../../domain/repositories/attendance.repository.js'

export function buildAttendanceListWhere(
  query: AttendanceQueryInput,
  scopedEnrollmentIds: string[] | null,
  scopedScheduleIds: string[] | null,
): Prisma.AttendanceWhereInput {
  const { enrollmentId, scheduleId, status, date } = query

  return {
    deletedAt: null,
    ...(status && { status }),
    ...(date && { date: new Date(date) }),
    ...(enrollmentId
      ? { enrollmentId }
      : scopedEnrollmentIds !== null && {
          enrollmentId: { in: scopedEnrollmentIds },
        }),
    ...(scheduleId
      ? { scheduleId }
      : scopedScheduleIds !== null && {
          scheduleId: { in: scopedScheduleIds },
        }),
  }
}
