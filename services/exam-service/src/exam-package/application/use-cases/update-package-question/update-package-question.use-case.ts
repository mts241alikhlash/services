import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  TeacherScope,
  canManageAll,
  type ScopeUser,
} from '../../../../question/application/teacher-scope.service.js'
import type { UpdatePackageQuestionInput } from './update-package-question.input.js'
import { prepareQuestion } from '../../../../question/domain/policies/prepare-question.policy.js'
import { assertValidPoints } from '../../../../question/domain/policies/validate-points.policy.js'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import {
  assertCanChange,
  assertEditable,
} from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { PACKAGE_CHANGED_MESSAGE } from '../add-package-question/add-package-question.use-case.js'

@Injectable()
export class UpdatePackageQuestionUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(
    user: ScopeUser,
    packageId: string,
    questionId: string,
    input: UpdatePackageQuestionInput,
  ): Promise<ExamPackageDetail> {
    if (
      input.bodyHtml === undefined &&
      input.content === undefined &&
      input.points === undefined
    ) {
      throw new BadRequestException('Tidak ada yang diubah')
    }
    if (input.points !== undefined) assertValidPoints(input.points)

    const pkg = await this.packages.findById(packageId)
    if (pkg === null) throw new NotFoundException('Paket tidak ditemukan')
    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, pkg.subjectId, pkg.gradeId)
    assertCanChange(pkg.createdById, user.id, canManageAll(user))
    const next = assertEditable(pkg.status)

    const question = await this.questions.findById(questionId)
    if (question?.packageId !== packageId) {
      throw new NotFoundException('Soal tidak ditemukan di paket ini')
    }

    const { bodyHtml, content } = prepareQuestion(
      question.type,
      input.bodyHtml ?? question.current.bodyHtml,
      input.content ?? question.current.content,
    )
    const updated = await this.packages.changeQuestion(
      packageId,
      { expected: pkg.status, next },
      questionId,
      question.revision,
      { bodyHtml, content, points: input.points ?? question.current.points },
      user.id,
    )
    if (updated === null) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return updated
  }
}
