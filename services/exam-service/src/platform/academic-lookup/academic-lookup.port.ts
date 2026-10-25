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

export abstract class IAcademicLookupPort {
  abstract teachingPairsOf(employeeId: string): Promise<TeachingPair[]>
  abstract gradesByIds(ids: string[]): Promise<GradeRef[]>
}
