export interface CreateStudentScoreInput {
  enrollmentId: string
  assessmentItemId: string
  score?: number
  note?: string
}
