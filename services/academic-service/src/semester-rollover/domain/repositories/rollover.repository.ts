import {
  ClassroomRolloverEntity,
  ClassroomSupervisorRolloverEntity,
  RolloverSemesterRef,
  TeachingAssignmentRolloverEntity,
} from '../entities/rollover.entity.js'

export interface RolloverSourceData {
  classrooms: ClassroomRolloverEntity[]
  supervisors: ClassroomSupervisorRolloverEntity[]
  assignments: TeachingAssignmentRolloverEntity[]
}

export interface RolloverResult {
  classrooms: { created: number; skipped: number }
  enrollments: { created: number; skipped: number }
  supervisors: { created: number; skipped: number }
  teachingAssignments: { created: number; skipped: number }
  schedules: { created: number; skipped: number }
}

export abstract class IRolloverRepository {
  abstract findSemesterWithAcademicYear(
    id: string,
  ): Promise<RolloverSemesterRef | null>

  abstract fetchSourceData(
    sourceSemesterId: string,
    sourceAcademicYearId: string,
  ): Promise<RolloverSourceData>

  abstract executeRollover(
    sourceData: RolloverSourceData,
    targetSemesterId: string,
    targetAcademicYearId: string,
    sourceSemesterId: string,
  ): Promise<RolloverResult>
}
