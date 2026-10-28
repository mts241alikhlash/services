import { Injectable } from '@nestjs/common'
import type { PaginatedResult } from '../../../../shared/domain/interfaces/repository.interface.js'
import type { ExamPackageSummary } from '../../../domain/entities/exam-package.entity.js'
import {
  IExamPackageRepository,
  type ExamPackageListQuery,
} from '../../../domain/repositories/exam-package.repository.js'

@Injectable()
export class ListExamPackagesUseCase {
  constructor(private readonly packages: IExamPackageRepository) {}

  execute(
    input: Partial<ExamPackageListQuery>,
  ): Promise<PaginatedResult<ExamPackageSummary>> {
    return this.packages.findAll({
      ...input,
      page: input.page ?? 1,
      limit: input.limit ?? 10,
    })
  }
}
