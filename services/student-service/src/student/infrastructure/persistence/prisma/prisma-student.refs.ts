import { IAcademicLookupPort } from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { StudentRow } from './prisma-student.includes.js'

export interface StudentAcademicRefs {
  grade: (gradeId: string | null | undefined) => GradeRef | null
  classroomCode: (classroomId: string) => string
}

export interface GradeRef {
  id: string
  name: string
  level: number
}

export async function resolveStudentAcademicRefs(
  academicLookup: IAcademicLookupPort,
  rows: StudentRow[],
): Promise<StudentAcademicRefs> {
  const [grades, classrooms] = await Promise.all([
    academicLookup.listGradesByIds([
      ...new Set(
        rows
          .map((row) => row.gradeId)
          .filter((gradeId): gradeId is string => gradeId !== null),
      ),
    ]),
    academicLookup.listClassroomsByIds([
      ...new Set(
        rows.flatMap((row) =>
          row.enrollments.map((enrollment) => enrollment.classroomId),
        ),
      ),
    ]),
  ])

  const gradeById = new Map(grades.map((grade) => [grade.id, grade]))
  const codeById = new Map(
    classrooms.map((classroom) => [classroom.id, classroom.code]),
  )

  return {
    grade: (gradeId) => {
      if (!gradeId) return null
      const grade = gradeById.get(gradeId)
      return grade
        ? { id: grade.id, name: grade.name ?? '', level: grade.level }
        : null
    },
    classroomCode: (classroomId) => codeById.get(classroomId) ?? '',
  }
}
