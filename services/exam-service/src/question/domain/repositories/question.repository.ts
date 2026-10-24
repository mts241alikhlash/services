import type { PaginatedResult } from '../../../shared/domain/interfaces/repository.interface.js'
import type { TeachingPair } from '../../../platform/academic-lookup/academic-lookup.port.js'
import type {
  Question,
  QuestionDetail,
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

export abstract class IQuestionRepository {
  abstract findAll(
    query: QuestionListQuery,
  ): Promise<PaginatedResult<QuestionSummary>>
  abstract findById(id: string): Promise<QuestionDetail | null>
  abstract findVersions(questionId: string): Promise<QuestionVersion[]>
  abstract create(input: NewQuestionInput): Promise<QuestionDetail>
  abstract editCurrentVersion(
    id: string,
    fields: VersionFields,
    status: QuestionStatus,
  ): Promise<QuestionDetail>
  abstract addVersion(
    id: string,
    fields: VersionFields,
    createdById: string,
  ): Promise<QuestionDetail>
  abstract softDelete(id: string): Promise<void>
}
