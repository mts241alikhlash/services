import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { ScopeUser } from '../../../../question/application/teacher-scope.service.js'
import type {
  ExamPackageDetail,
  PackageQuestionNote,
} from '../../../domain/entities/exam-package.entity.js'
import { assertCanReview } from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { PACKAGE_CHANGED_MESSAGE } from '../add-package-question/add-package-question.use-case.js'

@Injectable()
export class ReturnExamPackageUseCase {
  constructor(private readonly packages: IExamPackageRepository) {}

  async execute(
    user: ScopeUser,
    id: string,
    note: string,
    questionNotes: PackageQuestionNote[],
  ): Promise<ExamPackageDetail> {
    const text = note.trim()
    if (text.length === 0) {
      throw new BadRequestException('Catatan pengembalian wajib diisi')
    }

    const pkg = await this.packages.findById(id)
    if (pkg === null) throw new NotFoundException('Paket tidak ditemukan')
    assertCanReview(pkg.status)

    const inPackage = new Set(pkg.items.map((item) => item.questionId))
    if (questionNotes.some((entry) => !inPackage.has(entry.questionId))) {
      throw new BadRequestException(
        'Catatan soal harus untuk soal di paket ini',
      )
    }

    const moved = await this.packages.transition(
      id,
      ['SUBMITTED'],
      'RETURNED',
      {
        action: 'RETURN',
        byUserId: user.id,
        note: text,
        questionNotes,
      },
    )
    if (!moved) throw new ConflictException(PACKAGE_CHANGED_MESSAGE)
    return (await this.packages.findById(id)) as ExamPackageDetail
  }
}
