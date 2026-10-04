export interface BulkGenerateReportCardsInput {
  classroomId: string
  semesterId: string
}

export interface BulkGenerateReportCardsResult {
  total: number
  generated: number
  skipped: number
  skippedEnrollmentIds: string[]
}
