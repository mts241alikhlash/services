import { Injectable } from '@nestjs/common'
import type { ScopeUser } from '../../../../question/application/teacher-scope.service.js'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ExamPackageSummary } from '../../../domain/entities/exam-package.entity.js'
import {
  IExamPackageRepository,
  type ExamPackageListQuery,
} from '../../../domain/repositories/exam-package.repository.js'

const MANAGE_ALL = 'exam-questions.manage-all'

@Injectable()
export class ListExamPackagesUseCase {
  constructor(private readonly packages: IExamPackageRepository) {}

  execute(
    user: Pick<ScopeUser, 'id' | 'permissions'>,
    input: Partial<ExamPackageListQuery>,
  ): Promise<PaginatedResult<ExamPackageSummary>> {
    return this.packages.findAll({
      ...input,
      visibleTo: user.permissions.includes(MANAGE_ALL) ? undefined : user.id,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    })
  }
}
