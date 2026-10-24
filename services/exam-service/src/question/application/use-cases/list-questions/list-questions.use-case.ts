import { Injectable } from '@nestjs/common'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import {
  IQuestionRepository,
  type QuestionSummary,
} from '../../../domain/repositories/question.repository.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'
import type { ListQuestionsInput } from './list-questions.input.js'

@Injectable()
export class ListQuestionsUseCase {
  constructor(
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(
    user: ScopeUser,
    input: ListQuestionsInput,
  ): Promise<PaginatedResult<QuestionSummary>> {
    const scope = await this.scope.forUser(user)

    return this.questions.findAll({
      ...input,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
      pairs: scope.all ? null : scope.pairs,
    })
  }
}
