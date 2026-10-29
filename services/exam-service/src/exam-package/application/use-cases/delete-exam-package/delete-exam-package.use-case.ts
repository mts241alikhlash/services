import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  canManageAll,
  type ScopeUser,
} from '../../../../question/application/teacher-scope.service.js'
import { assertCanChange } from '../../../domain/policies/package-lifecycle.policy.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'

const KEPT_MESSAGE =
  'Paket yang menunggu tinjauan atau sudah dijadwalkan tidak bisa dihapus'

@Injectable()
export class DeleteExamPackageUseCase {
  constructor(private readonly packages: IExamPackageRepository) {}

  async execute(user: ScopeUser, id: string): Promise<void> {
    const existing = await this.packages.findById(id)
    if (existing === null) throw new NotFoundException('Paket tidak ditemukan')
    assertCanChange(existing.createdById, user.id, canManageAll(user))
    if (!(await this.packages.softDeleteUnscheduled(id))) {
      throw new ConflictException(KEPT_MESSAGE)
    }
  }
}
