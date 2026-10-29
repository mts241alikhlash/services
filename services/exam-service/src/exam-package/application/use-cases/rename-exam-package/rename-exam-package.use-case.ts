import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  TeacherScope,
  canManageAll,
  type ScopeUser,
} from '../../../../question/application/teacher-scope.service.js'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import {
  assertCanChange,
  assertEditable,
} from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { normalizeTitle } from '../../package-title.js'
import { PACKAGE_CHANGED_MESSAGE } from '../add-package-question/add-package-question.use-case.js'

@Injectable()
export class RenameExamPackageUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(
    user: ScopeUser,
    id: string,
    title: string,
  ): Promise<ExamPackageDetail> {
    const clean = normalizeTitle(title)
    const pkg = await this.packages.findById(id)
    if (pkg === null) throw new NotFoundException('Paket tidak ditemukan')
    this.scope.assertCovers(
      await this.scope.forUser(user),
      pkg.subjectId,
      pkg.gradeId,
    )
    assertCanChange(pkg.createdById, user.id, canManageAll(user))
    const next = assertEditable(pkg.status)

    const updated = await this.packages.renamePackage(
      id,
      { expected: pkg.status, next },
      clean,
    )
    if (updated === null) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return updated
  }
}
