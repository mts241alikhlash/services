import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { IEmployeeIdentityReadPort } from '../../../../platform/employee-identity/employee-identity.port.js'
import { resolveAuthor } from '../../../../question/application/resolve-author.js'
import {
  TeacherScope,
  type ScopeUser,
} from '../../../../question/application/teacher-scope.service.js'
import { prepareQuestion } from '../../../../question/domain/policies/prepare-question.policy.js'
import { assertValidPoints } from '../../../../question/domain/policies/validate-points.policy.js'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import type { QuestionType } from '../../../../question/domain/value-objects/question-content.js'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import { assertEditable } from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'

export interface AddPackageQuestionInput {
  type: QuestionType
  bodyHtml: string
  content: unknown
  points: number
  authorEmployeeId?: string
}

export const PACKAGE_CHANGED_MESSAGE = 'Status paket sudah berubah, muat ulang'

@Injectable()
export class AddPackageQuestionUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
    private readonly employees: IEmployeeIdentityReadPort,
  ) {}

  async execute(
    user: ScopeUser,
    packageId: string,
    input: AddPackageQuestionInput,
  ): Promise<ExamPackageDetail> {
    const pkg = await this.packages.findById(packageId)
    if (pkg === null) throw new NotFoundException('Paket tidak ditemukan')

    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, pkg.subjectId, pkg.gradeId)
    const next = assertEditable(pkg.status)
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

    const updated = await this.packages.addQuestion(
      packageId,
      { expected: pkg.status, next },
      {
        packageId,
        subjectId: pkg.subjectId,
        gradeId: pkg.gradeId,
        authorEmployeeId,
        type: input.type,
        createdById: user.id,
        bodyHtml,
        content,
        points: input.points,
      },
    )
    if (updated === null) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return updated
  }
}
