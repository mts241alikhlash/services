import {
  ClassroomDetail,
  IAcademicLookupPort,
  SemesterContext,
} from '../../../../platform/academic-lookup/academic-lookup.port.js'
import { withDisplayName } from '../../../../shared/utils/classroom-display-name.helper.js'
import {
  EnrollmentClassroomRef,
  EnrollmentSemesterRef,
} from '../../../domain/entities/enrollment.entity.js'

export interface AcademicRefs {
  classroomById: Map<string, EnrollmentClassroomRef>
  semesterById: Map<string, EnrollmentSemesterRef>
}

export async function resolveAcademicRefs(
  academicLookup: IAcademicLookupPort,
  rows: { classroomId: string; semesterId: string }[],
): Promise<AcademicRefs> {
  const [classrooms, semesters] = await Promise.all([
    academicLookup.listClassroomsByIds([
      ...new Set(rows.map((row) => row.classroomId)),
    ]),
    academicLookup.listSemestersByIds([
      ...new Set(rows.map((row) => row.semesterId)),
    ]),
  ])

  return {
    classroomById: new Map(
      classrooms.map((classroom) => [classroom.id, toClassroomRef(classroom)]),
    ),
    semesterById: new Map(
      semesters.map((semester) => [semester.id, toSemesterRef(semester)]),
    ),
  }
}

function toClassroomRef(classroom: ClassroomDetail): EnrollmentClassroomRef {
  const grade =
    classroom.gradeLevel === null && classroom.gradeName === null
      ? null
      : { level: classroom.gradeLevel ?? 0, name: classroom.gradeName ?? '' }

  return withDisplayName({
    id: classroom.id,
    code: classroom.code,
    name: classroom.name,
    gradeId: classroom.gradeId,
    academicYearId: classroom.academicYearId,
    capacity: classroom.capacity,
    grade,
  })
}

function toSemesterRef(semester: SemesterContext): EnrollmentSemesterRef {
  return {
    id: semester.id,
    academicYearId: semester.academicYearId,
    isActive: semester.isActive,
    type: semester.typeId
      ? { id: semester.typeId, name: semester.typeName ?? '' }
      : null,
    academicYear: {
      id: semester.academicYearId,
      name: semester.academicYearName ?? '',
    },
  }
}
