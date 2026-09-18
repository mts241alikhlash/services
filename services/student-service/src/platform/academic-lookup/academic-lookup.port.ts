export interface AcademicYearSummary {
  id: string
  name: string
}

export interface SemesterContext {
  id: string
  academicYearId: string
  academicYearName: string | null
  typeId: string | null
  typeName: string | null
  isActive: boolean
  sequence: number
}

export interface ClassroomDetail {
  id: string
  code: string
  name: string | null
  gradeId: string
  academicYearId: string
  capacity: number
  gradeLevel: number | null
  gradeName: string | null
}

export interface ClassroomSummary {
  id: string
  code: string
  name: string | null
}

export interface GradeSummary {
  id: string
  level: number
  name: string | null
}

export interface OccupationSummary {
  id: string
  name: string
  isActive: boolean
}

export interface EducationSummary {
  id: string
  name: string
}

export interface GradeLevelRef {
  level: number
  name: string | null
}

export interface ClassroomContext {
  classroom: unknown
  structure: unknown
  supervisor: unknown
  subjects: unknown[]
}

export abstract class IAcademicLookupPort {
  abstract findActiveAcademicYear(): Promise<AcademicYearSummary | null>
  abstract findActiveSemester(): Promise<SemesterContext | null>
  abstract findSemesterContext(id: string): Promise<SemesterContext | null>
  abstract listSemestersByAcademicYear(
    academicYearId: string,
  ): Promise<SemesterContext[]>
  abstract findAcademicYear(id: string): Promise<AcademicYearSummary | null>
  abstract listAcademicYears(ids: string[]): Promise<AcademicYearSummary[]>
  abstract findClassroomDetail(id: string): Promise<ClassroomDetail | null>
  abstract listClassroomsByAcademicYear(
    academicYearId: string,
  ): Promise<ClassroomDetail[]>
  abstract listClassroomsByIds(ids: string[]): Promise<ClassroomDetail[]>
  abstract listSemestersByIds(ids: string[]): Promise<SemesterContext[]>
  abstract listGradesByIds(ids: string[]): Promise<GradeSummary[]>
  abstract findClassroom(id: string): Promise<ClassroomSummary | null>
  abstract findClassroomByCode(code: string): Promise<ClassroomSummary | null>
  abstract listClassroomCodes(): Promise<string[]>
  abstract listGradeLevels(): Promise<number[]>
  abstract findGradeByLevel(level: number): Promise<GradeSummary | null>
  abstract listGradeLevelsForYear(
    academicYearId: string,
  ): Promise<GradeLevelRef[]>
  abstract findClassroomContext(
    classroomId: string,
    semesterId?: string,
    subjectLimit?: number,
  ): Promise<ClassroomContext | null>
  abstract findOccupation(id: string): Promise<OccupationSummary | null>
  abstract listOccupationsByIds(ids: string[]): Promise<OccupationSummary[]>
  abstract listEducationsByIds(ids: string[]): Promise<EducationSummary[]>
}
