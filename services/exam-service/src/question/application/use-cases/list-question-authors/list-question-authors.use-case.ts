import { Injectable } from '@nestjs/common'
import { IAuthorLookupPort } from '../../../../platform/author-lookup/author-lookup.port.js'
import { IQuestionRepository } from '../../../domain/repositories/question.repository.js'
import type { QuestionStatus } from '../../../domain/value-objects/question-content.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'

export interface QuestionAuthor {
  id: string
  name: string
}

@Injectable()
export class ListQuestionAuthorsUseCase {
  constructor(
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
    private readonly authors: IAuthorLookupPort,
  ) {}

  async execute(
    user: ScopeUser,
    filter: { status?: QuestionStatus },
  ): Promise<QuestionAuthor[]> {
    const scope = await this.scope.forUser(user)
    const ids = await this.questions.findAuthorIds(
      scope.all ? null : scope.pairs,
      filter.status,
    )
    const names = await this.authors.namesOf(ids)

    const known = (id: string) => names.has(id)
    return ids
      .map((id) => ({ id, name: names.get(id) ?? '-' }))
      .sort(
        (a, b) =>
          Number(known(b.id)) - Number(known(a.id)) ||
          a.name.localeCompare(b.name, 'id') ||
          a.id.localeCompare(b.id),
      )
  }
}
