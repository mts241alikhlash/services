export interface TeachingPair {
  subjectId: string
  gradeId: string
  subjectName?: string
}

export interface GradeRef {
  id: string
  level: number
  name: string | null
}

export interface ClassroomRef {
  id: string
  gradeId: string
  academicYearId: string
  name: string | null
}

export interface ActiveSemester {
  id: string
  academicYearId: string
}

export abstract class IAcademicLookupPort {
  abstract classroomsByIds(ids: string[]): Promise<ClassroomRef[]>
  abstract activeSemester(): Promise<ActiveSemester | null>
  abstract teachingPairsOf(employeeId: string): Promise<TeachingPair[]>
  abstract gradesByIds(ids: string[]): Promise<GradeRef[]>
}
