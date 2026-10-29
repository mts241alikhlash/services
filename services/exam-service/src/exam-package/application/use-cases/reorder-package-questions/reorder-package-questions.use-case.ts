import {
  BadRequestException,
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
export class ReorderPackageQuestionsUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(
    user: ScopeUser,
    packageId: string,
    questionIds: string[],
  ): Promise<ExamPackageDetail> {
    const pkg = await this.packages.findById(packageId)
    if (pkg === null) throw new NotFoundException('Paket tidak ditemukan')
    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, pkg.subjectId, pkg.gradeId)
    const next = assertEditable(pkg.status)

    const current = new Set(pkg.items.map((item) => item.questionId))
    if (
      questionIds.length !== current.size ||
      new Set(questionIds).size !== questionIds.length ||
      !questionIds.every((id) => current.has(id))
    ) {
      throw new BadRequestException(
        'Urutan harus memuat semua soal paket, masing-masing satu kali',
      )
    }

    const updated = await this.packages.reorderQuestions(
      packageId,
      { expected: pkg.status, next },
      questionIds,
    )
    if (updated === null) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return updated
  }
}
