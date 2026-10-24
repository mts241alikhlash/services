import { Injectable } from '@nestjs/common'
import { IAuthorLookupPort } from '../../../../platform/author-lookup/author-lookup.port.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  IQuestionRepository,
  type QuestionSummary,
} from '../../../domain/repositories/question.repository.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'
import type { ListQuestionsInput } from './list-questions.input.js'

export type QuestionListItem = QuestionSummary & { authorName: string | null }

@Injectable()
export class ListQuestionsUseCase {
  constructor(
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
    private readonly authors: IAuthorLookupPort,
  ) {}

  async execute(
    user: ScopeUser,
    input: ListQuestionsInput,
  ): Promise<PaginatedResult<QuestionListItem>> {
    const scope = await this.scope.forUser(user)

    const page = await this.questions.findAll({
      ...input,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
      pairs: scope.all ? null : scope.pairs,
    })
    const names = await this.authors.namesOf(
      page.data.map((question) => question.authorEmployeeId),
    )
    return {
      ...page,
      data: page.data.map((question) => ({
        ...question,
        authorName: names.get(question.authorEmployeeId) ?? null,
      })),
    }
  }
}
