import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  TeacherScope,
  type ScopeUser,
} from '../../../../question/application/teacher-scope.service.js'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import { assertEditable } from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { PACKAGE_CHANGED_MESSAGE } from '../add-package-question/add-package-question.use-case.js'

@Injectable()
export class RemovePackageQuestionUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(
    user: ScopeUser,
    packageId: string,
    questionId: string,
  ): Promise<ExamPackageDetail> {
    const pkg = await this.packages.findById(packageId)
    if (pkg === null) throw new NotFoundException('Paket tidak ditemukan')
    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, pkg.subjectId, pkg.gradeId)
    const next = assertEditable(pkg.status)
    if (!pkg.items.some((item) => item.questionId === questionId)) {
      throw new NotFoundException('Soal tidak ditemukan di paket ini')
    }

    const updated = await this.packages.removeQuestion(
      packageId,
      { expected: pkg.status, next },
      questionId,
    )
    if (updated === null) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return updated
  }
}
