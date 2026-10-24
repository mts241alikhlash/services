export interface TeachingPair {
  subjectId: string
  gradeId: string
}

export abstract class IAcademicLookupPort {
  abstract teachingPairsOf(employeeId: string): Promise<TeachingPair[]>
}
