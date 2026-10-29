import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { ScopeUser } from '../../../../question/application/teacher-scope.service.js'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import {
  assertCanReview,
  assertNotOwnReview,
} from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { PACKAGE_CHANGED_MESSAGE } from '../add-package-question/add-package-question.use-case.js'

@Injectable()
export class ApproveExamPackageUseCase {
  constructor(private readonly packages: IExamPackageRepository) {}

  async execute(
    user: ScopeUser,
    id: string,
    note?: string,
  ): Promise<ExamPackageDetail> {
    const pkg = await this.packages.findById(id)
    if (pkg === null) throw new NotFoundException('Paket tidak ditemukan')
    assertCanReview(pkg.status)
    assertNotOwnReview(pkg.createdById, user.id)

    const moved = await this.packages.transition(
      id,
      ['SUBMITTED'],
      'APPROVED',
      {
        action: 'APPROVE',
        byUserId: user.id,
        note: note?.trim() ? note.trim() : null,
        questionNotes: [],
      },
    )
    if (!moved) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return (await this.packages.findById(id)) as ExamPackageDetail
  }
}
