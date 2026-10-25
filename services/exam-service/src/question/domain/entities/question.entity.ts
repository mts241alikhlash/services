import type {
  QuestionContent,
  QuestionStatus,
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

export type ReviewAction = 'SUBMITTED' | 'APPROVED' | 'RETURNED'

export interface QuestionReview {
  id: string
  questionId: string
  versionNumber: number
  action: ReviewAction
  note: string | null
  byUserId: string
  createdAt: Date
}

export interface Question {
  id: string
  subjectId: string
  gradeId: string
  authorEmployeeId: string
  type: QuestionType
  status: QuestionStatus
  currentVersion: number
  approvedVersion: number | null
  revision: number
  createdById: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface QuestionDetail extends Question {
  current: QuestionVersion
  approved: QuestionVersion | null
  reviews: QuestionReview[]
}
