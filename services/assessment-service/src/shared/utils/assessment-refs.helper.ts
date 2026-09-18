import {
  IAcademicLookupPort,
  TeachingAssignmentDetail,
} from '../../platform/academic-lookup/academic-lookup.port.js'
import {
  EnrollmentSummary,
  IEnrollmentLookupPort,
} from '../../platform/enrollment-lookup/enrollment-lookup.port.js'

export interface AssessmentRefs {
  enrollment: (id: string) => EnrollmentSummary | null
  assignment: (id: string) => TeachingAssignmentDetail | null
}

export async function resolveAssessmentRefs(
  enrollmentLookup: IEnrollmentLookupPort,
  academicLookup: IAcademicLookupPort,
  ids: { enrollmentIds?: string[]; teachingAssignmentIds?: string[] },
): Promise<AssessmentRefs> {
  const [enrollments, assignments] = await Promise.all([
    enrollmentLookup.listByIds([...new Set(ids.enrollmentIds ?? [])]),
    academicLookup.listTeachingAssignments([
      ...new Set(ids.teachingAssignmentIds ?? []),
    ]),
  ])

  const enrollmentById = new Map(enrollments.map((row) => [row.id, row]))
  const assignmentById = new Map(assignments.map((row) => [row.id, row]))

  return {
    enrollment: (id) => enrollmentById.get(id) ?? null,
    assignment: (id) => assignmentById.get(id) ?? null,
  }
}
