import type {
  QuestionStatus,
  QuestionType,
} from '../../../domain/value-objects/question-content.js'

export interface ListQuestionsInput {
  page?: number
  limit?: number
  subjectId?: string
  gradeId?: string
  type?: QuestionType
  status?: QuestionStatus
  authorEmployeeId?: string
  search?: string
}
