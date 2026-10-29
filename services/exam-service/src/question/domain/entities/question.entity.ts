import type {
  QuestionContent,
  QuestionType,
} from '../value-objects/question-content.js'

export interface QuestionVersion {
  id: string
  questionId: string
  number: number
  bodyHtml: string
  content: QuestionContent
  points: number
  createdById: string
  createdAt: Date
}

export interface Question {
  id: string
  packageId: string
  copiedFromQuestionId: string | null
  copiedFromVersion: number | null
  subjectId: string
  gradeId: string
  authorEmployeeId: string
  type: QuestionType
  currentVersion: number
  revision: number
  createdById: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface QuestionDetail extends Question {
  current: QuestionVersion
}
