import { Injectable } from '@nestjs/common'
import {
  TeacherScope,
  type ScopeUser,
} from '../../../../question/application/teacher-scope.service.js'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { normalizeTitle } from '../../package-title.js'

export interface CreateDraftPackageInput {
  title: string
  subjectId: string
  gradeId: string
}

@Injectable()
export class CreateDraftPackageUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly scope: TeacherScope,
  ) {}

  async execute(
    user: ScopeUser,
    input: CreateDraftPackageInput,
  ): Promise<ExamPackageDetail> {
    const title = normalizeTitle(input.title)
    this.scope.assertCovers(
      await this.scope.forUser(user),
      input.subjectId,
      input.gradeId,
    )
    return this.packages.create({
      title,
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      createdById: user.id,
      items: [],
    })
  }
}
