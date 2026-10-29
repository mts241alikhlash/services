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
  assertCanSubmit,
} from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { PACKAGE_CHANGED_MESSAGE } from '../add-package-question/add-package-question.use-case.js'

@Injectable()
export class SubmitExamPackageUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(user: ScopeUser, id: string): Promise<ExamPackageDetail> {
    const pkg = await this.packages.findById(id)
    if (pkg === null) throw new NotFoundException('Paket tidak ditemukan')
    const scope = await this.scope.forUser(user)
    this.scope.assertCovers(scope, pkg.subjectId, pkg.gradeId)
    assertCanChange(pkg.createdById, user.id, canManageAll(user))
    assertCanSubmit(pkg.status, pkg.items.length)

    const moved = await this.packages.transition(
      id,
      [pkg.status],
      'SUBMITTED',
      { action: 'SUBMIT', byUserId: user.id, note: null, questionNotes: [] },
    )
    if (!moved) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return (await this.packages.findById(id)) as ExamPackageDetail
  }
}
