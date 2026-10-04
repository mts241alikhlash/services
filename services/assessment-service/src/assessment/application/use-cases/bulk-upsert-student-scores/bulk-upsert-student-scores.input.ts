export interface BulkStudentScoreRecordInput {
  enrollmentId: string
  score?: number
  note?: string
}

export interface BulkUpsertStudentScoresInput {
  assessmentItemId: string
  records: BulkStudentScoreRecordInput[]
}
