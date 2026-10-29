import type {
  ExamSchedule,
  ExamScheduleView,
} from '../domain/entities/exam-schedule.entity.js'
import type { IAcademicLookupPort } from '../../platform/academic-lookup/academic-lookup.port.js'

export async function withClassroomNames(
  academic: IAcademicLookupPort,
  rows: ExamSchedule[],
): Promise<ExamScheduleView[]> {
  const ids = [...new Set(rows.map((row) => row.classroomId))]
  const names = new Map(
    (await academic.classroomsByIds(ids)).map((room) => [room.id, room.name]),
  )
  return rows.map((row) => ({
    ...row,
    classroomName: names.get(row.classroomId) ?? null,
  }))
}
