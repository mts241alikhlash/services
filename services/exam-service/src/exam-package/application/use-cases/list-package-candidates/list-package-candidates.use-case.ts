import { Injectable } from '@nestjs/common'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import type { QuestionType } from '../../../../question/domain/value-objects/question-content.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import { toPlainSummary } from '../../../../shared/helpers/plain-summary.helper.js'

export interface PackageCandidate {
  id: string
  type: QuestionType
  summary: string
  points: number
  approvedVersion: number
}

export interface PackageCandidateQuery {
  subjectId: string
  gradeId: string
  search?: string
  page?: number
  limit?: number
}

@Injectable()
export class ListPackageCandidatesUseCase {
  constructor(private readonly questions: IQuestionRepository) {}

  async execute(
    input: PackageCandidateQuery,
  ): Promise<PaginatedResult<PackageCandidate>> {
    const page = await this.questions.findAll({
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      search: input.search,
      status: 'APPROVED',
      pairs: null,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    })
    return {
      ...page,
      data: page.data.map((question) => ({
        id: question.id,
        type: question.type,
        summary: toPlainSummary(question.bodyHtml),
        points: question.points,
        approvedVersion: question.approvedVersion ?? question.currentVersion,
      })),
    }
  }
}
