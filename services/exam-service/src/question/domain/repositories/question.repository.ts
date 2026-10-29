import type { PaginatedResult } from '../../../shared/domain/interfaces/repository.interface.js'
import type { TeachingPair } from '../../../platform/academic-lookup/academic-lookup.port.js'
import type {
  ApprovedQuestionRef,
  Question,
  QuestionDetail,
  ReviewAction,
  QuestionVersion,
} from '../entities/question.entity.js'
import type {
  QuestionContent,
  QuestionStatus,
  QuestionType,
} from '../value-objects/question-content.js'

export interface QuestionListQuery {
  page: number
  limit: number
  pairs: TeachingPair[] | null
  subjectId?: string
  gradeId?: string
  type?: QuestionType
  status?: QuestionStatus
  authorEmployeeId?: string
  search?: string
}

export interface QuestionSummary extends Question {
  bodyHtml: string
  points: number
}

export interface VersionFields {
  bodyHtml: string
  content: QuestionContent
  points: number
}

export interface NewQuestionInput extends VersionFields {
  subjectId: string
  gradeId: string
  authorEmployeeId: string
  type: QuestionType
  createdById: string
}

export interface ExpectedState {
  status: QuestionStatus
  currentVersion: number
}

export interface ReviewInput {
  from: QuestionStatus[]
  expectedVersion: number
  expectedRevision?: number
  to: QuestionStatus
  action: ReviewAction
  note: string | null
  byUserId: string
}

export interface QuestionPin {
  questionId: string
  number: number
}

export interface PinnedQuestion {
  questionId: string
  number: number
  type: QuestionType
  bodyHtml: string
  content: QuestionContent
  points: number
}

export abstract class IQuestionRepository {
  abstract findApprovedRefs(ids: string[]): Promise<ApprovedQuestionRef[]>
  abstract findPinned(pins: QuestionPin[]): Promise<PinnedQuestion[]>
  abstract findAll(
    query: QuestionListQuery,
  ): Promise<PaginatedResult<QuestionSummary>>
  abstract findAuthorIds(
    pairs: TeachingPair[] | null,
    status?: QuestionStatus,
  ): Promise<string[]>
  abstract findById(id: string): Promise<QuestionDetail | null>
  abstract findVersions(questionId: string): Promise<QuestionVersion[]>
  abstract create(input: NewQuestionInput): Promise<QuestionDetail>
  abstract editCurrentVersion(
    id: string,
    fields: VersionFields,
    status: QuestionStatus,
    expected: ExpectedState,
  ): Promise<QuestionDetail | null>
  abstract addVersion(
    id: string,
    fields: VersionFields,
    createdById: string,
    expected: ExpectedState,
  ): Promise<QuestionDetail | null>
  abstract applyReview(
    id: string,
    input: ReviewInput,
  ): Promise<QuestionDetail | null>
  abstract softDeleteNeverApproved(id: string): Promise<boolean>
}
