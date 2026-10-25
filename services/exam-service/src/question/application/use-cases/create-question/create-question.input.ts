import type { QuestionType } from '../../../domain/value-objects/question-content.js'

export interface CreateQuestionInput {
  subjectId: string
  gradeId: string
  authorEmployeeId?: string
  type: QuestionType
  bodyHtml: string
  content: unknown
  points: number
}
