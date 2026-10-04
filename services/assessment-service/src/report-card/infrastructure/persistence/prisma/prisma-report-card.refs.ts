import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { IEnrollmentLookupPort } from '../../../../platform/enrollment-lookup/enrollment-lookup.port.js'
import { ReportCardWithDetails } from '../../../domain/entities/report-card.entity.js'
import { ReportCardRow } from './prisma-report-card.includes.js'

export async function decorateReportCards(
  rows: ReportCardRow[],
  enrollmentLookup: IEnrollmentLookupPort,
  academicLookup: IAcademicLookupPort,
): Promise<ReportCardWithDetails[]> {
  if (rows.length === 0) return []

  const enrollments = await enrollmentLookup.listByIds([
    ...new Set(rows.map((row) => row.enrollmentId)),
  ])
  const enrollmentById = new Map(enrollments.map((row) => [row.id, row]))

  const [classrooms, semesters] = await Promise.all([
    academicLookup.listClassrooms([
      ...new Set(enrollments.map((row) => row.classroomId)),
    ]),
    academicLookup.listSemesters([
      ...new Set(enrollments.map((row) => row.semesterId)),
    ]),
  ])
  const classroomById = new Map(classrooms.map((row) => [row.id, row]))
  const semesterById = new Map(semesters.map((row) => [row.id, row]))

  return rows.map((row) => {
    const enrolment = enrollmentById.get(row.enrollmentId)
    if (!enrolment) return { ...row, enrollment: null }

    const classroom = classroomById.get(enrolment.classroomId)
    const semester = semesterById.get(enrolment.semesterId)

    return {
      ...row,
      enrollment: {
        id: enrolment.id,
        student: {
          nis: enrolment.studentNis,
          user: { profile: { name: enrolment.studentName } },
        },
        classroom: classroom
          ? { name: classroom.name, code: classroom.code }
          : null,
        semester: semester
          ? {
              type: { name: semester.typeName },
              academicYear: { name: semester.academicYearName },
            }
          : null,
      },
    }
  })
}
