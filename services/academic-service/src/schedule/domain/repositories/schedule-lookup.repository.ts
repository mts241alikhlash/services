import {
  ActiveSemesterIdRef,
  ClassroomIdRef,
  CreateTeachingAssignmentFromScheduleInput,
  TeachingAssignmentIdRef,
} from './schedule.repository.js'

export abstract class IScheduleLookupRepository {
  abstract findTeachingAssignmentById(
    id: string,
  ): Promise<TeachingAssignmentIdRef | null>
  abstract findValidClassroomById(id: string): Promise<ClassroomIdRef | null>
  abstract findActiveSemester(): Promise<ActiveSemesterIdRef | null>
  abstract findTeachingAssignmentBySubjectAndSemester(
    classroomId: string,
    subjectId: string,
    semesterId: string,
  ): Promise<TeachingAssignmentIdRef | null>
  abstract findAnyEmployeeIdForSubject(
    subjectId: string,
  ): Promise<string | null>
  abstract createTeachingAssignment(
    input: CreateTeachingAssignmentFromScheduleInput,
  ): Promise<TeachingAssignmentIdRef>
}
