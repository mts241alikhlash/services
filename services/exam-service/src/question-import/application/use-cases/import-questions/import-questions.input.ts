export interface ImportQuestionsInput {
  buffer: Buffer
  size: number
  fileName: string
  subjectId: string
  gradeId: string
  authorEmployeeId?: string
}

export interface ImportQuestionsResult {
  created: number
  questionIds: string[]
  errors: { row: number; reason: string }[]
}
