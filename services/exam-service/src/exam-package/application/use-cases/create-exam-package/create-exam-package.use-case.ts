import { Injectable } from '@nestjs/common'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import type { ExamPackageDetail } from '../../../domain/entities/exam-package.entity.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import { buildPackageItems, normalizeTitle } from '../../build-package-items.js'
import type { CreateExamPackageInput } from './create-exam-package.input.js'

@Injectable()
export class CreateExamPackageUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
  ) {}

  async execute(
    user: { id: string },
    input: CreateExamPackageInput,
  ): Promise<ExamPackageDetail> {
    const title = normalizeTitle(input.title)
    const items = await buildPackageItems(
      this.questions,
      input,
      input.questionIds,
    )
    return this.packages.create({
      title,
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      createdById: user.id,
      items,
    })
  }
}
