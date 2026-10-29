import { Injectable, NotFoundException } from '@nestjs/common'
import type { QuestionDetail } from '../../../../question/domain/entities/question.entity.js'
import { IQuestionRepository } from '../../../../question/domain/repositories/question.repository.js'
import { IExamPackageRepository } from '../../../domain/repositories/exam-package.repository.js'
import type { PackageViewer } from '../get-exam-package/get-exam-package.use-case.js'

@Injectable()
export class GetPackageQuestionUseCase {
  constructor(
    private readonly packages: IExamPackageRepository,
    private readonly questions: IQuestionRepository,
  ) {}

  async execute(
    viewer: PackageViewer,
    packageId: string,
    questionId: string,
  ): Promise<QuestionDetail> {
    const pkg = await this.packages.findById(packageId)
    if (
      pkg === null ||
      (!viewer.canSeeAll &&
        pkg.createdById !== viewer.id &&
        pkg.status !== 'APPROVED' &&
        pkg.status !== 'LOCKED')
    ) {
      throw new NotFoundException('Paket tidak ditemukan')
    }

    const question = await this.questions.findById(questionId)
    if (question?.packageId !== packageId) {
      throw new NotFoundException('Soal tidak ditemukan di paket ini')
    }
    return question
  }
}
