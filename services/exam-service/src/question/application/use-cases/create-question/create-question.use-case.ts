import { Injectable } from '@nestjs/common'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import type { QuestionDetail } from '../../../domain/entities/question.entity.js'
import { assertValidPoints } from '../../../domain/policies/validate-points.policy.js'
import { prepareQuestion } from '../../../domain/policies/prepare-question.policy.js'
import { IQuestionRepository } from '../../../domain/repositories/question.repository.js'
import { resolveAuthor } from '../../resolve-author.js'
import { TeacherScope, type ScopeUser } from '../../teacher-scope.service.js'
import type { CreateQuestionInput } from './create-question.input.js'

@Injectable()
export class CreateQuestionUseCase {
  constructor(
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
    private readonly employees: IEmployeeIdentityReadPort,
  ) {}

  async execute(
    user: ScopeUser,
    input: CreateQuestionInput,
  ): Promise<QuestionDetail> {
    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, input.subjectId, input.gradeId)
    assertValidPoints(input.points)

    const authorEmployeeId = await resolveAuthor(
      this.employees,
      user,
      scope.all,
      input.authorEmployeeId,
    )
    const { bodyHtml, content } = prepareQuestion(
      input.type,
      input.bodyHtml,
      input.content,
    )

    return this.questions.create({
      packageId: input.packageId,
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      authorEmployeeId,
      type: input.type,
      createdById: user.id,
      bodyHtml,
      content,
      points: input.points,
    })
  }
}
