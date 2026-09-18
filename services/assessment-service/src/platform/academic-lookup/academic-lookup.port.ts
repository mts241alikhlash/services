export interface PassingScoreQuery {
  gradeId: string
  academicYearId: string
  subjectId: string
}

export interface ResolvedPassingScore extends PassingScoreQuery {
  passingScore: number
}

export interface AcademicSettingSummary {
  defaultPassingScore: number | null
  weeklyHolidays: number[]
}

export interface SemesterSummary {
  id: string
  typeName: string | null
  academicYearName: string | null
}

export interface ClassroomSummary {
  id: string
  code: string | null
  name: string | null
}

export interface ActiveSemester {
  id: string
  academicYearId: string
  typeName: string | null
}

export interface TeachingAssignmentDetail {
  id: string
  employeeId: string
  classroomId: string
  subjectId: string
  semesterId: string
  subjectCode: string | null
  subjectName: string
  classroomCode: string
  classroomName: string | null
  classroomGradeId: string
  classroomAcademicYearId: string
  passingScore: number | null

  employeeUserId: string | null
}

export interface TeachingLoad {
  classroomCount: number
  subjectCount: number
}

export interface SupervisedClassroom {
  id: string
  code: string
  name: string | null
}

export interface ScheduleRef {
  id: string
  teachingAssignmentId: string
  timeSlotId: string
}

export interface TimetableLesson {
  id: string
  startTime: string
  endTime: string
  order: number
  subjectName: string
  classroomCode: string
  employeeUserId: string | null
  room: string | null
}

export abstract class IAcademicLookupPort {
  abstract findSetting(): Promise<AcademicSettingSummary | null>
  abstract findPassingScores(
    queries: PassingScoreQuery[],
  ): Promise<ResolvedPassingScore[]>
  abstract teachingAssignmentExists(id: string): Promise<boolean>
  abstract teachingAssignmentBelongsTo(
    id: string,
    employeeId: string,
  ): Promise<boolean>
  abstract listTeachingAssignments(
    ids: string[],
  ): Promise<TeachingAssignmentDetail[]>
  abstract listSchedules(ids: string[]): Promise<ScheduleRef[]>
  abstract listTeachingAssignmentsByEmployee(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingAssignmentDetail[]>
  abstract summariseTeachingLoad(
    employeeId: string,
    semesterId: string,
  ): Promise<TeachingLoad>
  abstract supervisesClassroom(
    employeeId: string,
    classroomId: string,
    semesterId: string,
  ): Promise<boolean>
  abstract listSupervisedClassrooms(
    employeeId: string,
    semesterId: string,
  ): Promise<SupervisedClassroom[]>
  abstract listLessons(
    scope: { classroomId?: string; employeeId?: string },
    day: string,
  ): Promise<TimetableLesson[]>
  abstract findActiveAcademicYearId(): Promise<string | null>
  abstract findActiveSemester(): Promise<ActiveSemester | null>
  abstract findSemester(id: string): Promise<SemesterSummary | null>
  abstract findClassroom(id: string): Promise<ClassroomSummary | null>
  abstract listClassrooms(ids: string[]): Promise<ClassroomSummary[]>
  abstract listSemesters(ids: string[]): Promise<SemesterSummary[]>
}
